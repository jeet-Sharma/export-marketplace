import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { ProductEntity } from './entities/product.entity.js';
import { ProductPriceTierEntity } from './entities/product-price-tier.entity.js';
import { OrganizationEntity } from '../identity/entities/organization.entity.js';
import { RolePermissionEntity } from '../identity/entities/role-permission.entity.js';
import { InventoryEntity } from '../inventory/entities/inventory.entity.js';
import { StockMovementEntity } from '../inventory/entities/stock-movement.entity.js';
import { ProductApprovalLogService } from './product-approval-log.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { SubmitProductDto } from './dto/submit-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';

/** Which permission a review stage requires, and which role scope must hold it (Part 2.11). */
const STAGE_REQUIREMENT: Record<'CHECKER' | 'ADMIN', { permission: string; scopeType: 'VENDOR' | 'PLATFORM' }> = {
  CHECKER: { permission: 'product.approve', scopeType: 'VENDOR' },
  ADMIN: { permission: 'product.approve', scopeType: 'PLATFORM' },
};

/**
 * Business logic for `product` (Part 3.1) — the Maker -> Checker -> Admin
 * approval pipeline, and the "editing a live product keeps it live" (M-03)
 * edit-in-place flow via pending_changes/pending_status.
 *
 * Every method is scoped by organizationId: reads filter WHERE
 * organization_id = :organizationId, writes check the row's
 * organization_id before touching it. This is the app-level half of the
 * two-lock model in Part 0.11 (RLS is the other half, not enabled yet).
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductPriceTierEntity)
    private readonly priceTierRepository: Repository<ProductPriceTierEntity>,
    private readonly approvalLogService: ProductApprovalLogService,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(organizationId: string): Promise<ProductEntity[]> {
    return this.productRepository.find({ where: { organizationId }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string, organizationId: string): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({ where: { id, organizationId } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  /**
   * Maker creates a product. Starts in DRAFT (the column default) — no
   * status is accepted from the caller.
   *
   * Also opens the matching `inventory` row (quantity 0, same unit as the
   * product) in the same transaction — inventory.product_id is NOT NULL
   * UNIQUE with no default row created anywhere else, so without this the
   * first stock adjustment for a brand new product would 404 (no row to
   * update).
   */
  async create(dto: CreateProductDto, organizationId: string, userId: string): Promise<ProductEntity> {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(ProductEntity);
      const inventoryRepo = manager.getRepository(InventoryEntity);

      const product = productRepo.create({
        ...dto,
        publicId: randomUUID(),
        organizationId,
        createdBy: userId,
        categoryId: dto.categoryId.toString(),
        basePrice: dto.basePrice.toString(),
        moq: dto.moq.toString(),
        weightKg: dto.weightKg?.toString() ?? null,
        lengthCm: dto.lengthCm?.toString() ?? null,
        widthCm: dto.widthCm?.toString() ?? null,
        heightCm: dto.heightCm?.toString() ?? null,
      });
      const savedProduct = await productRepo.save(product);

      await inventoryRepo.save(
        inventoryRepo.create({
          productId: savedProduct.id,
          organizationId,
          quantityAvailable: '0',
          quantityReserved: '0',
          lowStockThreshold: '0',
          unit: savedProduct.unit,
        }),
      );

      return savedProduct;
    });
  }

  /**
   * Edits a DRAFT (or REJECTED) product directly on its own columns. A
   * PUBLISHED/APPROVED product must go through submit() instead — the
   * migration's CHECK (pending_changes IS NULL OR status IN
   * ('PUBLISHED','APPROVED')) means pending_* only ever applies there, so
   * this method refuses to touch a live product's columns directly.
   */
  async update(id: string, dto: UpdateProductDto, organizationId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);

    if (product.status === 'PUBLISHED' || product.status === 'APPROVED') {
      throw new ConflictException(
        'A published or approved product cannot be edited directly — submit the change for review instead.',
      );
    }

    // Captured BEFORE Object.assign(product, patch) below mutates
    // product.unit — comparing dto.unit against the ALREADY-MUTATED
    // product.unit would always read as equal and silently skip the
    // safety check entirely.
    const originalUnit = product.unit;

    const patch: Record<string, unknown> = { ...dto };
    if (dto.categoryId !== undefined) patch.categoryId = dto.categoryId.toString();
    if (dto.basePrice !== undefined) patch.basePrice = dto.basePrice.toString();
    if (dto.moq !== undefined) patch.moq = dto.moq.toString();
    if (dto.weightKg !== undefined) patch.weightKg = dto.weightKg.toString();
    if (dto.lengthCm !== undefined) patch.lengthCm = dto.lengthCm.toString();
    if (dto.widthCm !== undefined) patch.widthCm = dto.widthCm.toString();
    if (dto.heightCm !== undefined) patch.heightCm = dto.heightCm.toString();

    Object.assign(product, patch);

    // inventory.unit must stay in lockstep with product.unit (both are
    // d_unit, and the two are meant to describe the same stock, Part 4.1)
    // — but relabeling the unit can never be done blindly. A DRAFT
    // product's inventory row is NOT guaranteed to be zero: the manual
    // adjustment endpoint (POST /inventory/:productId/adjust) has no
    // product-status gate, so a vendor can stock up a DRAFT product
    // before ever submitting it. Changing KG to TON on a row already
    // holding a real quantity would silently turn "500 KG" into "500
    // TON" — a 1000x data corruption, not a relabeling — since there is
    // no unit-conversion table to apply instead. assertUnitChangeIsSafe()
    // refuses the edit outright (Part 0.12's lost-update-guard posture:
    // refuse rather than silently corrupt) whenever real stock or
    // movement history already exists; the vendor must zero out and
    // rebuild the inventory row's history-free state first, or keep the
    // original unit.
    if (dto.unit !== undefined && dto.unit !== originalUnit) {
      return this.dataSource.transaction(async (manager) => {
        await this.assertUnitChangeIsSafe(manager, id, organizationId);
        const savedProduct = await manager.getRepository(ProductEntity).save(product);
        await manager
          .getRepository(InventoryEntity)
          .update({ productId: id, organizationId }, { unit: savedProduct.unit });
        return savedProduct;
      });
    }

    return this.productRepository.save(product);
  }

  /**
   * Submits a product for review (Part 3.1 status flow diagrams).
   *
   *  - DRAFT/REJECTED  -> PENDING_CHECKER (status changes directly)
   *  - PUBLISHED/APPROVED -> pending_changes/pending_status set (M-03);
   *    status itself does NOT change, so buyers keep seeing the current
   *    live version while the edit is in review.
   *
   * Any other current status (already PENDING_CHECKER/PENDING_ADMIN, or
   * DELISTED) cannot be submitted again.
   */
  async submit(id: string, dto: SubmitProductDto, organizationId: string, userId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);

    if (product.status === 'DRAFT' || product.status === 'REJECTED') {
      await this.assertPriceTiersAreGaplessAndMoqAligned(product);
      product.status = 'PENDING_CHECKER';
      return this.productRepository.save(product);
    }

    if (product.status === 'PUBLISHED' || product.status === 'APPROVED') {
      if (product.pendingStatus) {
        throw new ConflictException(
          'This product already has an edit awaiting review — wait for it to be approved or rejected before submitting another.',
        );
      }
      if (!dto.changes || Object.keys(dto.changes).length === 0) {
        throw new ConflictException('An edit to a live product requires at least one changed field.');
      }
      product.pendingChanges = dto.changes as Record<string, unknown>;
      product.pendingStatus = 'PENDING_CHECKER';
      product.pendingSubmittedBy = userId;
      product.pendingSubmittedAt = new Date();
      return this.productRepository.save(product);
    }

    throw new ConflictException(`Product in status ${product.status} cannot be submitted for review.`);
  }

  /**
   * Checker or Admin approves/rejects, depending on the product's current
   * pending stage. Both stages share this method because the only
   * difference between them is which status value is being resolved and
   * what it becomes next — the self-approval rule and the append-only log
   * write are identical.
   *
   * Self-approval is refused exactly as documented in the schema doc's
   * "Approval can't be self-approval" UPDATE statement (Part 3.1, M-02):
   * the actor cannot be the same person who created the product (new
   * product) or proposed the edit (pending edit), UNLESS the organization
   * has requires_second_approver = false.
   *
   * Role/permission check (Part 2.11/2.12): resolved BEFORE self-approval,
   * since "is this person allowed to review at all" is a coarser gate than
   * "did they submit this specific item". CHECKER stage requires the
   * `product.approve` permission via a VENDOR-scope role (VENDOR_CHECKER
   * or VENDOR_OWNER); ADMIN stage requires it via a PLATFORM-scope role
   * (ADMIN). Checked against the caller's role codes (passed in from
   * req.user.roles, resolved once by JwtAuthGuard) rather than the role
   * NAME, per role.entity.ts's own rule: code checks permissions, never
   * role names — this queries role_permission for the actual grant
   * instead of hardcoding 'VENDOR_CHECKER'/'ADMIN' as a switch.
   */
  async review(
    id: string,
    dto: ReviewProductDto,
    callerUserType: 'PLATFORM' | 'VENDOR' | 'BUYER',
    callerOrganizationId: string,
    userId: string,
    callerRoles: string[],
  ): Promise<ProductEntity> {
    return this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(ProductEntity);
      const orgRepo = manager.getRepository(OrganizationEntity);

      // A PLATFORM caller (the ADMIN stage) reviews vendor products across
      // every organization — their own organizationId is the platform org,
      // not the vendor's, so the lookup can't be scoped by it the way a
      // VENDOR caller's (the CHECKER stage) is. The assertCanReviewStage()
      // permission check below is what actually restricts who reaches
      // ADMIN-stage products, not this WHERE clause. A VENDOR caller is
      // still scoped by their own organizationId, exactly as before.
      const productWhere =
        callerUserType === 'PLATFORM' ? { id } : { id, organizationId: callerOrganizationId };

      // Pessimistic row lock: without it, two concurrent reviewers can both
      // read the same pending stage before either commits, both pass
      // resolveReviewStage()'s check, and both write an approval-log row
      // for a decision that should only ever happen once. Locking here
      // makes the second reviewer's transaction wait for the first to
      // commit, so it sees the now-updated status/pending_status and
      // resolveReviewStage() correctly reports "nothing pending" instead
      // of resolving the same stage twice.
      const product = await productRepo.findOne({
        where: productWhere,
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException(`Product ${id} not found`);
      }

      // From here on, the PRODUCT's own organizationId is the source of
      // truth for the vendor this review concerns — never the caller's,
      // which for an ADMIN reviewer is the platform org, not the vendor's.
      const productOrganizationId = product.organizationId;

      const { stage, isEdit } = this.resolveReviewStage(product);

      await this.assertCanReviewStage(manager, stage, callerRoles);

      const submitter = isEdit ? product.pendingSubmittedBy : product.createdBy;
      if (submitter === userId) {
        const org = await orgRepo.findOne({ where: { id: productOrganizationId } });
        if (!org || org.requiresSecondApprover) {
          throw new ForbiddenException("You can't approve or reject content you submitted.");
        }
      }

      const changesSnapshot = isEdit
        ? (product.pendingChanges as Record<string, unknown>)
        : this.snapshotProduct(product);

      // Captured before applyApproval() mutates product.unit, so this
      // reflects whether the ADMIN-approved edit actually changed the
      // unit — used below to keep inventory.unit in lockstep (Part 4.1:
      // inventory.unit "Same as the product's unit"). A PUBLISHED
      // product being edited here is exactly the case most likely to
      // have REAL stock (reservations, movement history) already, so
      // this is checked and refused BEFORE applyApproval() mutates
      // anything — approving the rest of the edit while silently
      // corrupting the unit is not an acceptable partial outcome.
      const unitBeforeApproval = product.unit;
      const pendingUnitChange =
        isEdit &&
        dto.action === 'APPROVED' &&
        typeof product.pendingChanges === 'object' &&
        product.pendingChanges !== null &&
        'unit' in product.pendingChanges &&
        (product.pendingChanges as Record<string, unknown>).unit !== unitBeforeApproval;

      if (pendingUnitChange) {
        await this.assertUnitChangeIsSafe(manager, product.id, productOrganizationId);
      }

      if (dto.action === 'APPROVED') {
        this.applyApproval(product, stage, isEdit);
      } else {
        this.applyRejection(product, isEdit);
      }

      const saved = await productRepo.save(product);

      if (saved.unit !== unitBeforeApproval) {
        await manager
          .getRepository(InventoryEntity)
          .update({ productId: saved.id, organizationId: productOrganizationId }, { unit: saved.unit });
      }

      await this.approvalLogService.record(
        {
          productId: product.id,
          organizationId: productOrganizationId,
          stage,
          action: dto.action,
          changeType: isEdit ? 'EDIT' : 'NEW_PRODUCT',
          changesSnapshot,
          actorUserId: userId,
          comments: dto.comments ?? null,
        },
        manager,
      );

      return saved;
    });
  }

  /**
   * APPROVED -> PUBLISHED (Part 3.1 status diagram). A separate action
   * from admin approval — an approved product is not automatically live;
   * this is what makes it visible to buyers, and is when published_at is
   * first set.
   */
  async publish(id: string, organizationId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);
    if (product.status !== 'APPROVED') {
      throw new ConflictException(`Product in status ${product.status} cannot be published; it must be APPROVED first.`);
    }
    product.status = 'PUBLISHED';
    product.publishedAt = product.publishedAt ?? new Date();
    return this.productRepository.save(product);
  }

  /**
   * PUBLISHED -> DELISTED (Part 3.1 status diagram) — removes the product
   * from buyer visibility without deleting the row (no hard deletes, Part
   * 0.8's rule applies here even though products aren't buyer PII).
   */
  async delist(id: string, organizationId: string): Promise<ProductEntity> {
    const product = await this.findOne(id, organizationId);
    if (product.status !== 'PUBLISHED') {
      throw new ConflictException(`Product in status ${product.status} cannot be delisted; it must be PUBLISHED.`);
    }
    product.status = 'DELISTED';
    return this.productRepository.save(product);
  }

  /**
   * Confirms the caller holds `product.approve` via a role in the scope
   * that stage requires (VENDOR for CHECKER, PLATFORM for ADMIN) — Part
   * 2.11's role_permission table, not a hardcoded role-name check. An
   * empty callerRoles array (no roles at all) is rejected the same way as
   * having the wrong roles, since the query below simply matches nothing.
   */
  private async assertCanReviewStage(
    manager: EntityManager,
    stage: 'CHECKER' | 'ADMIN',
    callerRoles: string[],
  ): Promise<void> {
    if (callerRoles.length === 0) {
      throw new ForbiddenException(`You do not have permission to review at the ${stage} stage.`);
    }

    const requirement = STAGE_REQUIREMENT[stage];
    const grant = await manager
      .getRepository(RolePermissionEntity)
      .createQueryBuilder('rolePermission')
      .innerJoin('rolePermission.role', 'role')
      .innerJoin('rolePermission.permission', 'permission')
      .where('role.code IN (:...roles)', { roles: callerRoles })
      .andWhere('role.scopeType = :scopeType', { scopeType: requirement.scopeType })
      .andWhere('permission.code = :permissionCode', { permissionCode: requirement.permission })
      .getCount();

    if (grant === 0) {
      throw new ForbiddenException(`You do not have permission to review at the ${stage} stage.`);
    }
  }

  /**
   * Part 3.3's "two rules [that] can't be written as a single-row
   * constraint" — checked here at submit time, exactly where the schema
   * doc says they must be ("DRAFT -> PENDING_CHECKER is refused
   * otherwise"):
   *   1. the first tier's min_qty must equal product.moq
   *   2. there must be no gap between one tier's max_qty and the next
   *      tier's min_qty (tiers are half-open [min, max), so "no gap"
   *      means tier[i].maxQty === tier[i+1].minQty exactly)
   *
   * A product with zero tiers has nothing to validate here — Part 3.3
   * doesn't require a product to have any tiers at all (base_price alone
   * covers pricing when none exist), only that IF tiers exist, they start
   * at moq and don't leave a gap. Overlap between tiers is refused by the
   * DB's tier_no_overlap GiST exclusion constraint (CreateVendorCatalog
   * migration) — deliberately not re-checked here, per this method's own
   * scope: gap/MOQ alignment only, not overlap.
   */
  private async assertPriceTiersAreGaplessAndMoqAligned(product: ProductEntity): Promise<void> {
    const tiers = await this.priceTierRepository.find({
      where: { productId: product.id, organizationId: product.organizationId },
      order: { minQty: 'ASC' },
    });

    if (tiers.length === 0) {
      return;
    }

    const firstTier = tiers[0];
    if (Number(firstTier.minQty) !== Number(product.moq)) {
      throw new ConflictException(
        `The first price tier must start at the product's MOQ (${product.moq}), but starts at ${firstTier.minQty}.`,
      );
    }

    for (let i = 0; i < tiers.length - 1; i++) {
      const current = tiers[i];
      const next = tiers[i + 1];
      if (current.maxQty === null) {
        // An open-ended tier ([min, ∞)) can only be the last one — the DB's
        // tier_no_overlap constraint would already refuse a tier after it
        // covering any overlapping range, but a NON-overlapping tier
        // starting above it would still leave this one's "upper" bound
        // undefined, which is itself a gap/ordering problem worth
        // rejecting explicitly rather than leaving ambiguous.
        throw new ConflictException(
          `Price tier starting at ${current.minQty} has no upper bound but is not the last tier.`,
        );
      }
      if (Number(current.maxQty) !== Number(next.minQty)) {
        throw new ConflictException(
          `There is a gap between price tiers: one ends at ${current.maxQty}, the next starts at ${next.minQty}.`,
        );
      }
    }
  }

  /**
   * Refuses a product.unit change whenever it could silently corrupt
   * existing stock data (Part 4.1/4.3): if inventory already holds a
   * non-zero quantity_available/quantity_reserved, or any stock_movement
   * row exists for this product, the unit is NOT relabeled — there is no
   * unit-conversion table in this schema (KG/TON/PIECE/BOX/CARTON/LITRE/
   * METRE aren't all even convertible into one another), so "update the
   * label but leave the number" would misrepresent real stock, and
   * "convert the number" would require business logic this schema
   * doesn't define. A quantity of exactly 0 with no movement history
   * (a fresh inventory row that has never been adjusted/reserved/shipped)
   * is the only state where changing the unit is unambiguous — there is
   * no existing quantity for the old unit to misrepresent.
   */
  private async assertUnitChangeIsSafe(
    manager: EntityManager,
    productId: string,
    organizationId: string,
  ): Promise<void> {
    const inventory = await manager
      .getRepository(InventoryEntity)
      .findOne({ where: { productId, organizationId } });

    // No inventory row at all (shouldn't happen — create() always opens
    // one — but if it's somehow missing there's nothing to misrepresent).
    if (!inventory) {
      return;
    }

    if (Number(inventory.quantityAvailable) !== 0 || Number(inventory.quantityReserved) !== 0) {
      throw new ConflictException(
        'This product\'s unit cannot be changed while its inventory holds a non-zero quantity — ' +
          'the stock would be silently reinterpreted under the new unit. Adjust stock to zero first.',
      );
    }

    const hasMovementHistory = await manager
      .getRepository(StockMovementEntity)
      .exists({ where: { productId, organizationId } });
    if (hasMovementHistory) {
      throw new ConflictException(
        "This product's unit cannot be changed once it has stock movement history — " +
          'past movements were recorded under the current unit and would become ambiguous.',
      );
    }
  }

  /** Determines whether this is a new-product review or a live-edit review, and which stage is being resolved. */
  private resolveReviewStage(product: ProductEntity): { stage: 'CHECKER' | 'ADMIN'; isEdit: boolean } {
    if (product.status === 'PENDING_CHECKER') {
      return { stage: 'CHECKER', isEdit: false };
    }
    if (product.status === 'PENDING_ADMIN') {
      return { stage: 'ADMIN', isEdit: false };
    }
    if (product.pendingStatus === 'PENDING_CHECKER') {
      return { stage: 'CHECKER', isEdit: true };
    }
    if (product.pendingStatus === 'PENDING_ADMIN') {
      return { stage: 'ADMIN', isEdit: true };
    }
    throw new ConflictException('Product has nothing pending review.');
  }

  private applyApproval(product: ProductEntity, stage: 'CHECKER' | 'ADMIN', isEdit: boolean): void {
    if (!isEdit) {
      if (stage === 'CHECKER') {
        product.status = 'PENDING_ADMIN';
        return;
      }
      // ADMIN stage on a new product: the Part 3.1 diagram shows
      // "APPROVED --> PUBLISHED" as two separate arrows, so admin
      // approval only reaches APPROVED here. Going live is a distinct
      // action — see publish().
      product.status = 'APPROVED';
      return;
    }

    if (stage === 'CHECKER') {
      product.pendingStatus = 'PENDING_ADMIN';
      return;
    }

    // ADMIN approves an edit: copy pending_changes onto the real columns
    // and clear pending_*, all in this same transaction (M-03).
    Object.assign(product, product.pendingChanges);
    product.pendingChanges = null;
    product.pendingStatus = null;
    product.pendingSubmittedBy = null;
    product.pendingSubmittedAt = null;
  }

  private applyRejection(product: ProductEntity, isEdit: boolean): void {
    if (!isEdit) {
      product.status = 'REJECTED';
      return;
    }
    // Rejecting a live edit discards the proposed change; the product
    // itself is untouched and stays PUBLISHED/APPROVED.
    product.pendingChanges = null;
    product.pendingStatus = null;
    product.pendingSubmittedBy = null;
    product.pendingSubmittedAt = null;
  }

  private snapshotProduct(product: ProductEntity): Record<string, unknown> {
    const { id: _id, organizationId: _organizationId, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } =
      product;
    return rest as Record<string, unknown>;
  }
}
