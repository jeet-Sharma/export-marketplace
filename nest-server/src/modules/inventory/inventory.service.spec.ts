import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';

/**
 * Unit tests for InventoryService (Part 4). Exercises reserve/release/
 * convert/consume/recordManualAdjustment against a hand-mocked
 * QueryBuilder + repositories rather than real Postgres — these verify
 * the service builds the right atomic statement and movement_type/
 * available_change/reserved_change mapping (Part 4.3's table); the actual
 * atomicity guarantee (no read-then-write gap) is a property of Postgres
 * itself and is exercised by e2e against real Postgres, not re-tested
 * here.
 */
describe('InventoryService', () => {
  const ORG_A = 'org-a';
  const PRODUCT_ID = 'product-1';

  /** Builds a chainable query-builder mock whose .execute() resolves to the given result. */
  function makeQueryBuilder(executeResult: { affected: number; raw: unknown[] }) {
    const qb = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      setParameters: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(executeResult),
    };
    return qb;
  }

  let inventoryRepository: {
    findOne: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let movementRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let reservationRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };
  let dataSource: {
    transaction: ReturnType<typeof vi.fn>;
    getRepository: ReturnType<typeof vi.fn>;
  };
  let service: InventoryService;
  let lastQueryBuilder: ReturnType<typeof makeQueryBuilder>;

  beforeEach(() => {
    lastQueryBuilder = makeQueryBuilder({ affected: 1, raw: [{ quantity_available: '800', quantity_reserved: '200', id: 'inv-1' }] });

    inventoryRepository = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(() => lastQueryBuilder),
    };
    movementRepository = {
      create: vi.fn((input) => input),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    reservationRepository = {
      create: vi.fn((input) => input),
      save: vi.fn((entity) => Promise.resolve(entity)),
      findOne: vi.fn(),
    };

    dataSource = {
      transaction: vi.fn(async (work) => {
        const manager = {
          getRepository: (entity: { name?: string }) => {
            if (entity?.name === 'StockReservationEntity') return reservationRepository;
            if (entity?.name === 'StockMovementEntity') return movementRepository;
            return inventoryRepository;
          },
        };
        return work(manager);
      }),
      getRepository: vi.fn((entity: { name?: string }) =>
        entity?.name === 'StockReservationEntity' ? reservationRepository : inventoryRepository,
      ),
    };

    service = new InventoryService(inventoryRepository as never, movementRepository as never, dataSource as never);
  });

  describe('findByProduct', () => {
    it('throws NotFoundException when no inventory row exists for the product/org pair', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findByProduct(PRODUCT_ID, ORG_A)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reserveStock', () => {
    it('throws ConflictException and creates no reservation when quantity_available is insufficient', async () => {
      lastQueryBuilder.execute.mockResolvedValue({ affected: 0, raw: [] });

      await expect(
        service.reserveStock({
          productId: PRODUCT_ID,
          organizationId: ORG_A,
          quantity: '5000',
          checkoutSessionId: 'checkout-1',
          expiresAt: new Date(),
        }),
      ).rejects.toThrow(ConflictException);
      expect(reservationRepository.save).not.toHaveBeenCalled();
    });

    it('creates a HELD reservation and a RESERVED movement with the exact Part 4.3 sign mapping', async () => {
      const result = await service.reserveStock({
        productId: PRODUCT_ID,
        organizationId: ORG_A,
        quantity: '200',
        checkoutSessionId: 'checkout-1',
        expiresAt: new Date('2026-01-01'),
      });

      expect(result.status).toBe('HELD');
      expect(reservationRepository.save).toHaveBeenCalledTimes(1);

      // RESERVED: available_change is negative, reserved_change is positive (Part 4.3 table).
      expect(movementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          movementType: 'RESERVED',
          availableChange: '-200',
          reservedChange: '200',
          referenceType: 'RESERVATION',
        }),
      );
    });
  });

  describe('releaseReservation', () => {
    it('throws NotFoundException when the reservation does not exist', async () => {
      reservationRepository.findOne.mockResolvedValue(null);

      await expect(service.releaseReservation('res-404')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the reservation is already RELEASED/CONSUMED/EXPIRED', async () => {
      reservationRepository.findOne.mockResolvedValue({
        id: 'res-1',
        status: 'CONSUMED',
        productId: PRODUCT_ID,
        organizationId: ORG_A,
        quantity: '200',
      });

      await expect(service.releaseReservation('res-1')).rejects.toThrow(ConflictException);
    });

    it('releases a HELD reservation with the RELEASED sign mapping (+available, -reserved)', async () => {
      reservationRepository.findOne.mockResolvedValue({
        id: 'res-1',
        status: 'HELD',
        productId: PRODUCT_ID,
        organizationId: ORG_A,
        quantity: '200',
      });

      const result = await service.releaseReservation('res-1');

      expect(result.status).toBe('RELEASED');
      expect(result.resolvedAt).toBeInstanceOf(Date);
      expect(movementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ movementType: 'RELEASED', availableChange: '200', reservedChange: '-200' }),
      );
    });
  });

  describe('convertReservation', () => {
    it('throws NotFoundException when the reservation does not exist', async () => {
      reservationRepository.findOne.mockResolvedValue(null);

      await expect(service.convertReservation('res-404', 'order-1')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the reservation is not HELD', async () => {
      reservationRepository.findOne.mockResolvedValue({ id: 'res-1', status: 'CONVERTED' });

      await expect(service.convertReservation('res-1', 'order-1')).rejects.toThrow(ConflictException);
    });

    it('converts a HELD reservation and links the order id, without touching inventory balances', async () => {
      reservationRepository.findOne.mockResolvedValue({ id: 'res-1', status: 'HELD', orderId: null });

      const result = await service.convertReservation('res-1', 'order-1');

      expect(result.status).toBe('CONVERTED');
      expect(result.orderId).toBe('order-1');
      expect(inventoryRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('consumeReservation', () => {
    it('throws ConflictException when the reservation is not CONVERTED', async () => {
      reservationRepository.findOne.mockResolvedValue({ id: 'res-1', status: 'HELD' });

      await expect(service.consumeReservation('res-1')).rejects.toThrow(ConflictException);
    });

    it('consumes a CONVERTED reservation with the SALE_OUT mapping (0 available, -reserved)', async () => {
      reservationRepository.findOne.mockResolvedValue({
        id: 'res-1',
        status: 'CONVERTED',
        productId: PRODUCT_ID,
        organizationId: ORG_A,
        quantity: '200',
      });

      const result = await service.consumeReservation('res-1');

      expect(result.status).toBe('CONSUMED');
      expect(movementRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ movementType: 'SALE_OUT', availableChange: '0', reservedChange: '-200' }),
      );
    });
  });

  describe('recordManualAdjustment', () => {
    it('throws BadRequestException when notes is empty', async () => {
      await expect(
        service.recordManualAdjustment(PRODUCT_ID, ORG_A, { quantityChange: '10', notes: '' }, 'ADJUSTMENT'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when no inventory row exists for the product', async () => {
      lastQueryBuilder.execute.mockResolvedValue({ affected: 0, raw: [] });

      await expect(
        service.recordManualAdjustment(
          PRODUCT_ID,
          ORG_A,
          { quantityChange: '10', notes: 'recount' },
          'ADJUSTMENT',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('records an ADJUSTMENT movement referencing the inventory row id (no reservation/order to point at)', async () => {
      const result = await service.recordManualAdjustment(
        PRODUCT_ID,
        ORG_A,
        { quantityChange: '15', notes: 'physical recount found extra stock', userId: 'user-1' },
        'ADJUSTMENT',
      );

      expect(result).toEqual(
        expect.objectContaining({
          movementType: 'ADJUSTMENT',
          availableChange: '15',
          reservedChange: '0',
          referenceType: 'MANUAL',
          referenceId: 'inv-1',
          notes: 'physical recount found extra stock',
          createdBy: 'user-1',
        }),
      );
    });

    it('records a DAMAGE movement the same way', async () => {
      const result = await service.recordManualAdjustment(
        PRODUCT_ID,
        ORG_A,
        { quantityChange: '-5', notes: 'water damage in warehouse' },
        'DAMAGE',
      );

      expect(result.movementType).toBe('DAMAGE');
      expect(result.availableChange).toBe('-5');
      expect(result.createdBy).toBeNull();
    });
  });
});
