import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RolePermissionEntity } from '../identity/entities/role-permission.entity.js';
import { InventoryEntity } from './entities/inventory.entity.js';
import { StockReservationEntity } from './entities/stock-reservation.entity.js';
import { StockMovementEntity } from './entities/stock-movement.entity.js';

/**
 * Part 2.11's "Starting permission set for vendor roles" table lists
 * `inventory.manage` under VENDOR_MAKER; VENDOR_OWNER holds everything a
 * Maker does, so both are granted it (see the migration seed). Any
 * organization member without one of these roles — e.g. a bare
 * VENDOR_CHECKER, or a user with no roles at all — must not be able to
 * change stock levels or resolve alerts, since checking req.user.
 * organizationId alone (the prior state) only confirmed WHICH org, not
 * whether the caller was allowed to write to it at all.
 */
const INVENTORY_MANAGE_PERMISSION = 'inventory.manage';

export interface ManualAdjustmentInput {
  quantityChange: string;
  notes: string;
  userId?: string | null;
}

/**
 * Part 4 — Inventory. reserve/release/convert/consume implement the exact
 * atomic pattern from the schema doc (Part 4.1/4.2): a single
 * UPDATE ... RETURNING on `inventory`, immediately followed by a
 * stock_reservation transition and a stock_movement row, all in one
 * database transaction so `inventory.quantity_reserved` always equals the
 * sum of HELD + CONVERTED stock_reservation rows.
 *
 * These four methods are intentionally NOT exposed as public HTTP routes
 * (see inventory.controller.ts) — they exist so a future Checkout/Order
 * module (Part 7, not built yet) can call them directly as the buyer's
 * checkout progresses. Routing "reserve stock" as a public endpoint would
 * let anyone lock stock with no corresponding checkout, which is exactly
 * the abuse case Part 4.2's design avoids.
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryEntity)
    private readonly inventoryRepository: Repository<InventoryEntity>,
    @InjectRepository(StockMovementEntity)
    private readonly movementRepository: Repository<StockMovementEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findByProduct(productId: string, organizationId: string): Promise<InventoryEntity> {
    const inventory = await this.inventoryRepository.findOne({ where: { productId, organizationId } });
    if (!inventory) {
      throw new NotFoundException(`Inventory for product ${productId} not found`);
    }
    return inventory;
  }

  /**
   * Confirms the caller holds `inventory.manage` via any of their roles
   * (VENDOR_MAKER/VENDOR_OWNER per the seed migration) — checked against
   * the actual grant, not a hardcoded role-name switch, matching
   * ProductsService.assertCanReviewStage()'s pattern. Called by
   * InventoryController before any inventory-mutating action (manual
   * adjustment, alert resolution); read-only routes are unaffected —
   * every organization member can still view stock/movements/alerts.
   */
  async assertCanManageInventory(callerRoles: string[]): Promise<void> {
    if (callerRoles.length === 0) {
      throw new ForbiddenException('You do not have permission to manage inventory.');
    }

    const grant = await this.dataSource
      .getRepository(RolePermissionEntity)
      .createQueryBuilder('rolePermission')
      .innerJoin('rolePermission.role', 'role')
      .innerJoin('rolePermission.permission', 'permission')
      .where('role.code IN (:...roles)', { roles: callerRoles })
      .andWhere('permission.code = :permissionCode', { permissionCode: INVENTORY_MANAGE_PERMISSION })
      .getCount();

    if (grant === 0) {
      throw new ForbiddenException('You do not have permission to manage inventory.');
    }
  }

  /**
   * Reserves stock for a checkout line — HELD row created, quantity_available
   * decreases, quantity_reserved increases. Fails (0 rows updated) if there
   * isn't enough quantity_available; no reservation row is created in that
   * case. Matches the schema doc's atomic UPDATE ... WHERE quantity_available
   * >= :qty RETURNING statement (Part 4.1).
   */
  async reserveStock(input: {
    productId: string;
    organizationId: string;
    quantity: string;
    checkoutSessionId: string;
    expiresAt: Date;
  }): Promise<StockReservationEntity> {
    return this.dataSource.transaction(async (manager) => {
      const inventoryRepo = manager.getRepository(InventoryEntity);
      const reservationRepo = manager.getRepository(StockReservationEntity);
      const movementRepo = manager.getRepository(StockMovementEntity);

      const updateResult = await inventoryRepo
        .createQueryBuilder()
        .update(InventoryEntity)
        .set({
          quantityAvailable: () => `quantity_available - :qty`,
          quantityReserved: () => `quantity_reserved + :qty`,
        })
        .where('product_id = :productId AND organization_id = :organizationId AND quantity_available >= :qty', {
          productId: input.productId,
          organizationId: input.organizationId,
          qty: input.quantity,
        })
        .setParameters({ qty: input.quantity })
        .returning('*')
        .execute();

      if (updateResult.affected === 0) {
        throw new ConflictException(`Not enough stock available for product ${input.productId}.`);
      }

      const updatedInventory = updateResult.raw[0] as { quantity_available: string; quantity_reserved: string };

      const reservation = reservationRepo.create({
        productId: input.productId,
        organizationId: input.organizationId,
        checkoutSessionId: input.checkoutSessionId,
        quantity: input.quantity,
        status: 'HELD',
        expiresAt: input.expiresAt,
      });
      const savedReservation = await reservationRepo.save(reservation);

      await movementRepo.save(
        movementRepo.create({
          productId: input.productId,
          organizationId: input.organizationId,
          movementType: 'RESERVED',
          availableChange: `-${input.quantity}`,
          reservedChange: input.quantity,
          availableAfter: updatedInventory.quantity_available,
          reservedAfter: updatedInventory.quantity_reserved,
          referenceType: 'RESERVATION',
          referenceId: savedReservation.id,
        }),
      );

      return savedReservation;
    });
  }

  /**
   * Releases a HELD or CONVERTED reservation — payment failed, checkout
   * cancelled, or order rejected. quantity_reserved decreases and
   * quantity_available is restored.
   */
  async releaseReservation(reservationId: string, organizationId: string): Promise<StockReservationEntity> {
    return this.dataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(StockReservationEntity);
      const inventoryRepo = manager.getRepository(InventoryEntity);
      const movementRepo = manager.getRepository(StockMovementEntity);

      // Pessimistic row lock: without it, two concurrent calls against the
      // same reservation (e.g. a duplicate release request and an expiry
      // sweep) can both read HELD/CONVERTED before either commits, both
      // pass the status check below, and both apply the inventory
      // give-back — double-crediting quantity_available. Locking makes the
      // second call wait for the first to commit, so it re-reads the
      // now-RELEASED status and correctly hits the ConflictException below
      // instead of releasing the same stock twice.
      //
      // organizationId is part of the WHERE, not just read off the row
      // afterward — a caller (the future Checkout/Order module) passes the
      // org it expects this reservation to belong to, and a mismatch is
      // indistinguishable from "not found" rather than silently operating
      // on another organization's stock.
      const reservation = await reservationRepo.findOne({
        where: { id: reservationId, organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) {
        throw new NotFoundException(`Reservation ${reservationId} not found`);
      }
      if (reservation.status !== 'HELD' && reservation.status !== 'CONVERTED') {
        throw new ConflictException(`Reservation ${reservationId} is ${reservation.status}, cannot be released.`);
      }

      const updateResult = await inventoryRepo
        .createQueryBuilder()
        .update(InventoryEntity)
        .set({
          quantityAvailable: () => `quantity_available + :qty`,
          quantityReserved: () => `quantity_reserved - :qty`,
        })
        .where('product_id = :productId AND organization_id = :organizationId', {
          productId: reservation.productId,
          organizationId: reservation.organizationId,
        })
        .setParameters({ qty: reservation.quantity })
        .returning('*')
        .execute();

      const updatedInventory = updateResult.raw[0] as { quantity_available: string; quantity_reserved: string };

      reservation.status = 'RELEASED';
      reservation.resolvedAt = new Date();
      const savedReservation = await reservationRepo.save(reservation);

      await movementRepo.save(
        movementRepo.create({
          productId: reservation.productId,
          organizationId: reservation.organizationId,
          movementType: 'RELEASED',
          availableChange: reservation.quantity,
          reservedChange: `-${reservation.quantity}`,
          availableAfter: updatedInventory.quantity_available,
          reservedAfter: updatedInventory.quantity_reserved,
          referenceType: 'RESERVATION',
          referenceId: savedReservation.id,
        }),
      );

      return savedReservation;
    });
  }

  /**
   * Payment captured — a HELD reservation becomes CONVERTED and is linked
   * to the order it paid for. Inventory balances do not change here (the
   * hold already moved the stock out of available); only the reservation
   * row's status/order_id change.
   */
  async convertReservation(
    reservationId: string,
    organizationId: string,
    orderId: string,
  ): Promise<StockReservationEntity> {
    return this.dataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(StockReservationEntity);

      // Pessimistic row lock, same reasoning as releaseReservation():
      // without it, a concurrent release (payment failed) and a concurrent
      // convert (payment captured) racing on the same HELD reservation
      // could both pass their status check before either commits — one
      // reservation would end up saved as CONVERTED after its stock was
      // already given back by the other's release. organizationId is
      // scoped in the WHERE for the same reason as releaseReservation().
      const reservation = await reservationRepo.findOne({
        where: { id: reservationId, organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) {
        throw new NotFoundException(`Reservation ${reservationId} not found`);
      }
      if (reservation.status !== 'HELD') {
        throw new ConflictException(`Reservation ${reservationId} is ${reservation.status}, cannot be converted.`);
      }

      reservation.status = 'CONVERTED';
      reservation.orderId = orderId;
      return reservationRepo.save(reservation);
    });
  }

  /**
   * Order shipped — a CONVERTED reservation is consumed. Stock leaves
   * quantity_reserved permanently (quantity_available already dropped
   * when the stock was first reserved, per Part 4.3's "Why").
   */
  async consumeReservation(reservationId: string, organizationId: string): Promise<StockReservationEntity> {
    return this.dataSource.transaction(async (manager) => {
      const reservationRepo = manager.getRepository(StockReservationEntity);
      const inventoryRepo = manager.getRepository(InventoryEntity);
      const movementRepo = manager.getRepository(StockMovementEntity);

      // Pessimistic row lock — same reasoning as releaseReservation()/
      // convertReservation(): prevents a concurrent release/consume race
      // on the same reservation from both passing the status check and
      // both decrementing quantity_reserved. organizationId is scoped in
      // the WHERE for the same reason as releaseReservation().
      const reservation = await reservationRepo.findOne({
        where: { id: reservationId, organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!reservation) {
        throw new NotFoundException(`Reservation ${reservationId} not found`);
      }
      if (reservation.status !== 'CONVERTED') {
        throw new ConflictException(`Reservation ${reservationId} is ${reservation.status}, cannot be consumed.`);
      }

      const updateResult = await inventoryRepo
        .createQueryBuilder()
        .update(InventoryEntity)
        .set({ quantityReserved: () => `quantity_reserved - :qty` })
        .where('product_id = :productId AND organization_id = :organizationId', {
          productId: reservation.productId,
          organizationId: reservation.organizationId,
        })
        .setParameters({ qty: reservation.quantity })
        .returning('*')
        .execute();

      const updatedInventory = updateResult.raw[0] as { quantity_available: string; quantity_reserved: string };

      reservation.status = 'CONSUMED';
      reservation.resolvedAt = new Date();
      const savedReservation = await reservationRepo.save(reservation);

      await movementRepo.save(
        movementRepo.create({
          productId: reservation.productId,
          organizationId: reservation.organizationId,
          movementType: 'SALE_OUT',
          availableChange: '0',
          reservedChange: `-${reservation.quantity}`,
          availableAfter: updatedInventory.quantity_available,
          reservedAfter: updatedInventory.quantity_reserved,
          referenceType: 'RESERVATION',
          referenceId: savedReservation.id,
        }),
      );

      return savedReservation;
    });
  }

  /**
   * Vendor-facing manual stock change — ADJUSTMENT (either direction) or
   * DAMAGE (stock leaving), the two movement types the migration requires
   * `notes` for (CHECK movement_type NOT IN ('ADJUSTMENT','DAMAGE') OR
   * notes <> ''). This is the one write path exposed as a public endpoint
   * (see inventory.controller.ts) because it has no corresponding
   * reservation/order to originate from.
   */
  async recordManualAdjustment(
    productId: string,
    organizationId: string,
    input: ManualAdjustmentInput,
    movementType: 'ADJUSTMENT' | 'DAMAGE',
  ): Promise<StockMovementEntity> {
    if (!input.notes || input.notes.trim().length === 0) {
      throw new BadRequestException('notes is required for a manual adjustment or damage entry.');
    }

    // DAMAGE always removes stock — the migration's own CHECK only
    // constrains notes, not sign, so the service enforces it: a caller
    // submitting a positive quantityChange for DAMAGE would otherwise
    // increase available stock while the audit trail records it as
    // damage. ADJUSTMENT is intentionally left signed either way (a
    // recount can find more or less than recorded).
    // A zero quantityChange (either movement type) would write
    // available_change = 0 and reserved_change = 0, which the migration's
    // own CHECK (available_change <> 0 OR reserved_change <> 0) refuses —
    // caught here as a clean 400 instead of an unhandled DB constraint
    // error. DAMAGE is additionally restricted to strictly negative, not
    // just non-zero, since damage can never increase stock.
    if (Number(input.quantityChange) === 0) {
      throw new BadRequestException('quantityChange must not be zero.');
    }
    if (movementType === 'DAMAGE' && Number(input.quantityChange) > 0) {
      throw new BadRequestException('quantityChange for a DAMAGE entry must be negative.');
    }

    return this.dataSource.transaction(async (manager) => {
      const inventoryRepo = manager.getRepository(InventoryEntity);
      const movementRepo = manager.getRepository(StockMovementEntity);

      // The WHERE guards BOTH cases that make this UPDATE affect 0 rows:
      // "no such inventory row for this product/org" and "this change
      // would drive quantity_available negative". Distinguishing them
      // requires knowing which one actually happened, so existence is
      // checked first (see below) — without that split, a negative
      // adjustment against real inventory would previously fall through
      // to the DB's own CHECK(quantity_available >= 0) and surface as an
      // unhandled 500 from the driver instead of a clean 409.
      const inventoryExists = await inventoryRepo.exists({ where: { productId, organizationId } });
      if (!inventoryExists) {
        throw new NotFoundException(`Inventory for product ${productId} not found`);
      }

      const updateResult = await inventoryRepo
        .createQueryBuilder()
        .update(InventoryEntity)
        .set({ quantityAvailable: () => `quantity_available + :qty` })
        .where(
          'product_id = :productId AND organization_id = :organizationId AND quantity_available + :qty >= 0',
          { productId, organizationId },
        )
        .setParameters({ qty: input.quantityChange })
        .returning('*')
        .execute();

      if (updateResult.affected === 0) {
        // Existence was already confirmed above, so reaching here means
        // the ONLY reason this UPDATE matched no row is the quantity
        // floor — this adjustment would make quantity_available negative.
        throw new ConflictException(
          `This adjustment would leave quantity_available negative for product ${productId}.`,
        );
      }

      const updatedInventory = updateResult.raw[0] as {
        id: string;
        quantity_available: string;
        quantity_reserved: string;
      };

      // reference_id is NOT NULL with no FK (it points at different tables
      // depending on reference_type, per Part 4.3's "Why"). For MANUAL
      // entries there is no reservation/order to point at, so the
      // inventory row's own id is used — a real, stable id that always
      // exists for this product, rather than an invented placeholder.
      return movementRepo.save(
        movementRepo.create({
          productId,
          organizationId,
          movementType,
          availableChange: input.quantityChange,
          reservedChange: '0',
          availableAfter: updatedInventory.quantity_available,
          reservedAfter: updatedInventory.quantity_reserved,
          referenceType: 'MANUAL',
          referenceId: updatedInventory.id,
          notes: input.notes,
          createdBy: input.userId ?? null,
        }),
      );
    });
  }
}
