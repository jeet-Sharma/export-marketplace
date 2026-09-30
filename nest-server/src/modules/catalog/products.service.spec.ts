import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ProductApprovalLogService } from './product-approval-log.service.js';

/**
 * Unit tests for ProductsService (Part 3.1). Repositories/DataSource are
 * hand-mocked rather than backed by a real DB, so these tests exercise the
 * service's own logic (status transitions, self-approval, org scoping) in
 * isolation from Postgres — the DB-level rules (CHECK constraints,
 * composite FKs, exclusion constraints) are exercised separately by e2e
 * against real Postgres, not re-tested here.
 */
describe('ProductsService', () => {
  let productRepository: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let orgRepository: { findOne: ReturnType<typeof vi.fn> };
  let inventoryRepository: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let approvalLogService: { record: ReturnType<typeof vi.fn> };
  let dataSource: { transaction: ReturnType<typeof vi.fn> };
  let service: ProductsService;

  const ORG_A = 'org-a';
  const ORG_B = 'org-b';
  const MAKER = 'user-maker';
  const CHECKER = 'user-checker';

  function makeProduct(overrides: Record<string, unknown> = {}) {
    return {
      id: 'product-1',
      organizationId: ORG_A,
      status: 'DRAFT',
      createdBy: MAKER,
      pendingChanges: null,
      pendingStatus: null,
      pendingSubmittedBy: null,
      pendingSubmittedAt: null,
      publishedAt: null,
      rowVersion: 1,
      ...overrides,
    };
  }

  beforeEach(() => {
    productRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn((input) => input),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    // review()'s self-approval check defaults to "organization requires a
    // second approver" unless a test overrides this — matching the
    // migration's own column default (requires_second_approver = true).
    orgRepository = { findOne: vi.fn().mockResolvedValue({ requiresSecondApprover: true }) };
    inventoryRepository = {
      create: vi.fn((input) => input),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };
    approvalLogService = { record: vi.fn() };
    dataSource = {
      // review()/create() run inside dataSource.transaction — hand a
      // manager whose getRepository resolves to the product/org/inventory
      // mock above depending on which entity class is requested, so the
      // transactional code path is exercised without a real DB.
      transaction: vi.fn(async (work) => {
        const manager = {
          getRepository: (entity: { name?: string }) => {
            if (entity?.name === 'OrganizationEntity') return orgRepository;
            if (entity?.name === 'InventoryEntity') return inventoryRepository;
            return productRepository;
          },
        };
        return work(manager);
      }),
    };

    service = new ProductsService(
      productRepository as never,
      approvalLogService as unknown as ProductApprovalLogService,
      dataSource as never,
    );
  });

  describe('org scoping', () => {
    it('findOne throws NotFoundException when the product belongs to a different organization', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('product-1', ORG_B)).rejects.toThrow(NotFoundException);
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-1', organizationId: ORG_B },
      });
    });

    it('findAll filters by the caller organizationId', async () => {
      productRepository.find.mockResolvedValue([]);

      await service.findAll(ORG_A);

      expect(productRepository.find).toHaveBeenCalledWith({
        where: { organizationId: ORG_A },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('create()', () => {
    it('creates the product and a matching zero-quantity inventory row in the same transaction', async () => {
      const dto = { categoryId: 1, basePrice: 10, moq: 5, unit: 'PIECE' } as never;

      const result = await service.create(dto, ORG_A, MAKER);

      expect(result.unit).toBe('PIECE');
      expect(inventoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_A,
          quantityAvailable: '0',
          quantityReserved: '0',
          lowStockThreshold: '0',
          unit: 'PIECE',
        }),
      );
      expect(inventoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('status transitions', () => {
    it('submit() moves a DRAFT product straight to PENDING_CHECKER', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT' }));

      const result = await service.submit('product-1', {}, ORG_A, MAKER);

      expect(result.status).toBe('PENDING_CHECKER');
    });

    it('submit() on a PUBLISHED product sets pending_* and leaves status untouched (M-03)', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'PUBLISHED' }));

      const result = await service.submit(
        'product-1',
        { changes: { basePrice: 4.2 } },
        ORG_A,
        MAKER,
      );

      expect(result.status).toBe('PUBLISHED');
      expect(result.pendingStatus).toBe('PENDING_CHECKER');
      expect(result.pendingChanges).toEqual({ basePrice: 4.2 });
      expect(result.pendingSubmittedBy).toBe(MAKER);
    });

    it('submit() on a PUBLISHED product requires at least one change', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'PUBLISHED' }));

      await expect(service.submit('product-1', {}, ORG_A, MAKER)).rejects.toThrow(ConflictException);
    });

    it('submit() refuses a second live edit while one is already pending review', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({
          status: 'PUBLISHED',
          pendingStatus: 'PENDING_CHECKER',
          pendingChanges: { basePrice: 1.11 },
          pendingSubmittedBy: MAKER,
        }),
      );

      await expect(
        service.submit('product-1', { changes: { basePrice: 2.22 } }, ORG_A, MAKER),
      ).rejects.toThrow(ConflictException);
    });

    it('submit() refuses a product that is already PENDING_ADMIN', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'PENDING_ADMIN' }));

      await expect(service.submit('product-1', {}, ORG_A, MAKER)).rejects.toThrow(ConflictException);
    });

    it('publish() requires the product to be APPROVED first', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'PENDING_ADMIN' }));

      await expect(service.publish('product-1', ORG_A)).rejects.toThrow(ConflictException);
    });

    it('publish() moves an APPROVED product to PUBLISHED and stamps published_at once', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'APPROVED', publishedAt: null }));

      const result = await service.publish('product-1', ORG_A);

      expect(result.status).toBe('PUBLISHED');
      expect(result.publishedAt).toBeInstanceOf(Date);
    });

    it('delist() requires the product to be PUBLISHED first', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'APPROVED' }));

      await expect(service.delist('product-1', ORG_A)).rejects.toThrow(ConflictException);
    });
  });

  describe('review() — self-approval (M-02)', () => {
    it('rejects when the actor created the product and the org requires a second approver', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );

      await expect(
        service.review('product-1', { action: 'APPROVED' }, ORG_A, MAKER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a different actor to approve', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );

      const result = await service.review('product-1', { action: 'APPROVED' }, ORG_A, CHECKER);

      expect(result.status).toBe('PENDING_ADMIN');
      expect(approvalLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'APPROVED', stage: 'CHECKER', actorUserId: CHECKER }),
        expect.anything(),
      );
    });

    it('throws ConflictException when there is nothing pending review', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT' }));

      await expect(
        service.review('product-1', { action: 'APPROVED' }, ORG_A, CHECKER),
      ).rejects.toThrow(ConflictException);
    });

    it('rejecting a pending edit clears pending_* but keeps the product PUBLISHED', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({
          status: 'PUBLISHED',
          pendingStatus: 'PENDING_ADMIN',
          pendingChanges: { basePrice: 9.99 },
          pendingSubmittedBy: MAKER,
        }),
      );

      const result = await service.review(
        'product-1',
        { action: 'REJECTED', comments: 'Price too low' },
        ORG_A,
        CHECKER,
      );

      expect(result.status).toBe('PUBLISHED');
      expect(result.pendingChanges).toBeNull();
      expect(result.pendingStatus).toBeNull();
    });

    it('approving a pending edit at the ADMIN stage copies pending_changes onto the product', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({
          status: 'PUBLISHED',
          pendingStatus: 'PENDING_ADMIN',
          pendingChanges: { basePrice: 5.5 },
          pendingSubmittedBy: MAKER,
        }),
      );

      const result = await service.review('product-1', { action: 'APPROVED' }, ORG_A, CHECKER);

      expect(result.basePrice).toBe(5.5);
      expect(result.pendingChanges).toBeNull();
      expect(result.pendingStatus).toBeNull();
      expect(result.status).toBe('PUBLISHED');
    });
  });
});
