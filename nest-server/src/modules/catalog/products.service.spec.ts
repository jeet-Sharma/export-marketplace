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
  let priceTierRepository: { find: ReturnType<typeof vi.fn> };
  let orgRepository: { findOne: ReturnType<typeof vi.fn> };
  let inventoryRepository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let rolePermissionQueryBuilder: {
    innerJoin: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    andWhere: ReturnType<typeof vi.fn>;
    getCount: ReturnType<typeof vi.fn>;
  };
  let rolePermissionRepository: { createQueryBuilder: ReturnType<typeof vi.fn> };
  let approvalLogService: { record: ReturnType<typeof vi.fn> };
  let dataSource: { transaction: ReturnType<typeof vi.fn> };
  let service: ProductsService;

  const ORG_A = 'org-a';
  const ORG_B = 'org-b';
  const MAKER = 'user-maker';
  const CHECKER = 'user-checker';
  const ADMIN = 'user-admin';

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
    priceTierRepository = { find: vi.fn().mockResolvedValue([]) };
    inventoryRepository = {
      create: vi.fn((input) => input),
      save: vi.fn((entity) => Promise.resolve(entity)),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    // Defaults to "caller holds the permission" so existing status-
    // transition tests (which don't care about role enforcement) keep
    // passing; role-enforcement tests below override this per-case.
    rolePermissionQueryBuilder = {
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      getCount: vi.fn().mockResolvedValue(1),
    };
    rolePermissionRepository = {
      createQueryBuilder: vi.fn(() => rolePermissionQueryBuilder),
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
            if (entity?.name === 'RolePermissionEntity') return rolePermissionRepository;
            return productRepository;
          },
        };
        return work(manager);
      }),
    };

    service = new ProductsService(
      productRepository as never,
      priceTierRepository as never,
      approvalLogService as unknown as ProductApprovalLogService,
      dataSource as never,
    );
  });

  /** Every review() call in tests that don't care about roles uses this — matches a VENDOR_CHECKER/ADMIN caller. */
  const ANY_REVIEWER_ROLES = ['VENDOR_CHECKER', 'ADMIN'];

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

    it('update() does not touch the inventory row when unit is not part of the edit', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT', unit: 'KG' }));

      await service.update('product-1', { name: 'New Name' } as never, ORG_A);

      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(inventoryRepository.update).not.toHaveBeenCalled();
    });

    it('update() keeps inventory.unit in lockstep when a DRAFT product\'s unit changes', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT', unit: 'KG' }));

      const result = await service.update('product-1', { unit: 'TON' } as never, ORG_A);

      expect(result.unit).toBe('TON');
      expect(inventoryRepository.update).toHaveBeenCalledWith(
        { productId: 'product-1', organizationId: ORG_A },
        { unit: 'TON' },
      );
    });
  });

  describe('review() — self-approval (M-02)', () => {
    it('rejects when the actor created the product and the org requires a second approver', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );

      await expect(
        service.review('product-1', { action: 'APPROVED' }, 'VENDOR', ORG_A, MAKER, ANY_REVIEWER_ROLES),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a different actor to approve', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );

      const result = await service.review(
        'product-1',
        { action: 'APPROVED' },
        'VENDOR',
        ORG_A,
        CHECKER,
        ANY_REVIEWER_ROLES,
      );

      expect(result.status).toBe('PENDING_ADMIN');
      expect(approvalLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'APPROVED', stage: 'CHECKER', actorUserId: CHECKER }),
        expect.anything(),
      );
    });

    it('throws ConflictException when there is nothing pending review', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT' }));

      await expect(
        service.review('product-1', { action: 'APPROVED' }, 'VENDOR', ORG_A, CHECKER, ANY_REVIEWER_ROLES),
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
        'PLATFORM',
        ORG_A,
        CHECKER,
        ANY_REVIEWER_ROLES,
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

      const result = await service.review(
        'product-1',
        { action: 'APPROVED' },
        'PLATFORM',
        ORG_A,
        CHECKER,
        ANY_REVIEWER_ROLES,
      );

      expect(result.basePrice).toBe(5.5);
      expect(result.pendingChanges).toBeNull();
      expect(result.pendingStatus).toBeNull();
      expect(result.status).toBe('PUBLISHED');
    });

    it('syncs inventory.unit when an ADMIN-approved live edit changes the product unit', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({
          status: 'PUBLISHED',
          unit: 'KG',
          pendingStatus: 'PENDING_ADMIN',
          pendingChanges: { unit: 'TON' },
          pendingSubmittedBy: MAKER,
        }),
      );

      const result = await service.review(
        'product-1',
        { action: 'APPROVED' },
        'PLATFORM',
        ORG_A,
        CHECKER,
        ANY_REVIEWER_ROLES,
      );

      expect(result.unit).toBe('TON');
      expect(inventoryRepository.update).toHaveBeenCalledWith(
        { productId: 'product-1', organizationId: ORG_A },
        { unit: 'TON' },
      );
    });

    it('does not touch inventory.unit when an approved edit leaves unit unchanged', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({
          status: 'PUBLISHED',
          unit: 'KG',
          pendingStatus: 'PENDING_ADMIN',
          pendingChanges: { basePrice: 5.5 },
          pendingSubmittedBy: MAKER,
        }),
      );

      await service.review('product-1', { action: 'APPROVED' }, 'PLATFORM', ORG_A, CHECKER, ANY_REVIEWER_ROLES);

      expect(inventoryRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('review() — role/permission enforcement (Part 2.11/2.12)', () => {
    it('rejects a caller with no roles at all', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );

      await expect(
        service.review('product-1', { action: 'APPROVED' }, 'VENDOR', ORG_A, CHECKER, []),
      ).rejects.toThrow(ForbiddenException);
      // Rejected before ever querying role_permission — an empty role list
      // can never match anything, so there's no reason to hit the DB.
      expect(rolePermissionRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('rejects a CHECKER-stage review when the caller does not hold product.approve for any role', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );
      rolePermissionQueryBuilder.getCount.mockResolvedValue(0);

      await expect(
        service.review('product-1', { action: 'APPROVED' }, 'VENDOR', ORG_A, CHECKER, ['VENDOR_MAKER']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a CHECKER-stage review when the caller holds VENDOR_CHECKER', async () => {
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );

      const result = await service.review(
        'product-1',
        { action: 'APPROVED' },
        'VENDOR',
        ORG_A,
        CHECKER,
        ['VENDOR_CHECKER'],
      );

      expect(result.status).toBe('PENDING_ADMIN');
      expect(rolePermissionQueryBuilder.andWhere).toHaveBeenCalledWith('role.scopeType = :scopeType', {
        scopeType: 'VENDOR',
      });
    });

    it('rejects an ADMIN-stage review from a VENDOR_CHECKER — a vendor role cannot self-serve the platform stage', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'PENDING_ADMIN', createdBy: MAKER }));
      // Simulates the real query: a VENDOR_CHECKER role does not satisfy
      // the ADMIN stage's PLATFORM scopeType requirement, so the (mocked)
      // count is 0 for this specific role/stage pairing.
      rolePermissionQueryBuilder.getCount.mockResolvedValue(0);

      await expect(
        service.review('product-1', { action: 'APPROVED' }, 'VENDOR', ORG_A, ADMIN, ['VENDOR_CHECKER']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows an ADMIN-stage review when the caller holds the platform ADMIN role', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'PENDING_ADMIN', createdBy: MAKER }));

      // A real ADMIN reviewer is a PLATFORM-type caller — their own
      // organizationId (passed here as ORG_B, a stand-in for "the
      // platform org") is deliberately NOT the product's ORG_A, matching
      // how review() looks the product up by id alone for PLATFORM
      // callers rather than scoping by the caller's own org.
      const result = await service.review(
        'product-1',
        { action: 'APPROVED' },
        'PLATFORM',
        ORG_B,
        ADMIN,
        ['ADMIN'],
      );

      expect(result.status).toBe('APPROVED');
      expect(productRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'product-1' } }),
      );
      expect(rolePermissionQueryBuilder.andWhere).toHaveBeenCalledWith('role.scopeType = :scopeType', {
        scopeType: 'PLATFORM',
      });
    });

    it('checks role/permission before the self-approval check', async () => {
      // A VENDOR_MAKER without product.approve at all should be rejected
      // for lack of permission, not for self-approval — even though this
      // actor also happens to be the product's creator.
      productRepository.findOne.mockResolvedValue(
        makeProduct({ status: 'PENDING_CHECKER', createdBy: MAKER }),
      );
      rolePermissionQueryBuilder.getCount.mockResolvedValue(0);

      await expect(
        service.review('product-1', { action: 'APPROVED' }, 'VENDOR', ORG_A, MAKER, ['VENDOR_MAKER']),
      ).rejects.toThrow(ForbiddenException);
      // orgRepository.findOne is only reached by the self-approval check —
      // if permission is checked first, it's never called for this case.
      expect(orgRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe('submit() — price tier MOQ and gap validation (Part 3.3)', () => {
    it('allows submission when the product has no price tiers at all', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT', moq: '100' }));
      priceTierRepository.find.mockResolvedValue([]);

      const result = await service.submit('product-1', {}, ORG_A, MAKER);

      expect(result.status).toBe('PENDING_CHECKER');
    });

    it('allows submission when tiers start at moq and have no gaps', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT', moq: '100' }));
      priceTierRepository.find.mockResolvedValue([
        { minQty: '100', maxQty: '500', unitPrice: '415.00' },
        { minQty: '500', maxQty: '1000', unitPrice: '373.50' },
        { minQty: '1000', maxQty: null, unitPrice: '332.00' },
      ]);

      const result = await service.submit('product-1', {}, ORG_A, MAKER);

      expect(result.status).toBe('PENDING_CHECKER');
    });

    it('rejects submission when the first tier does not start at product.moq', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT', moq: '100' }));
      priceTierRepository.find.mockResolvedValue([{ minQty: '150', maxQty: null, unitPrice: '10.00' }]);

      await expect(service.submit('product-1', {}, ORG_A, MAKER)).rejects.toThrow(ConflictException);
    });

    it('rejects submission when there is a gap between two tiers', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT', moq: '100' }));
      priceTierRepository.find.mockResolvedValue([
        { minQty: '100', maxQty: '500', unitPrice: '415.00' },
        // Gap: this tier starts at 600, not 500 — 500-600 is priced by nothing.
        { minQty: '600', maxQty: null, unitPrice: '373.50' },
      ]);

      await expect(service.submit('product-1', {}, ORG_A, MAKER)).rejects.toThrow(ConflictException);
    });

    it('rejects submission when a non-last tier is open-ended', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'DRAFT', moq: '100' }));
      priceTierRepository.find.mockResolvedValue([
        { minQty: '100', maxQty: null, unitPrice: '415.00' },
        { minQty: '500', maxQty: null, unitPrice: '373.50' },
      ]);

      await expect(service.submit('product-1', {}, ORG_A, MAKER)).rejects.toThrow(ConflictException);
    });

    it('validates tiers again on re-submission of a REJECTED product', async () => {
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'REJECTED', moq: '50' }));
      priceTierRepository.find.mockResolvedValue([{ minQty: '999', maxQty: null, unitPrice: '1.00' }]);

      await expect(service.submit('product-1', {}, ORG_A, MAKER)).rejects.toThrow(ConflictException);
    });

    it('does NOT re-validate tiers on a live-edit submission (PUBLISHED product)', async () => {
      // Live-edit submissions stage pending_changes on product columns,
      // not on price tiers — tiers are a separate child resource with
      // their own endpoints, so the moq/gap check only runs on the
      // DRAFT/REJECTED -> PENDING_CHECKER path.
      productRepository.findOne.mockResolvedValue(makeProduct({ status: 'PUBLISHED', moq: '100' }));

      const result = await service.submit(
        'product-1',
        { changes: { basePrice: 4.2 } },
        ORG_A,
        MAKER,
      );

      expect(result.pendingStatus).toBe('PENDING_CHECKER');
      expect(priceTierRepository.find).not.toHaveBeenCalled();
    });
  });
});
