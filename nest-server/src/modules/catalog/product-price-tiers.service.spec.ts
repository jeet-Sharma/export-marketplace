import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProductPriceTiersService } from './product-price-tiers.service.js';

/**
 * Unit tests for ProductPriceTiersService (Part 3.3). Verifies the
 * organization-scoping guard on every method and that no gap/overlap/MOQ
 * rule is invented at this layer — the only DB-enforced rule (tiers can't
 * overlap) is deliberately NOT re-implemented here; see the service's own
 * class comment and product-price-tiers.controller.ts.
 */
describe('ProductPriceTiersService', () => {
  let tierRepository: {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let productRepository: { exists: ReturnType<typeof vi.fn> };
  let service: ProductPriceTiersService;

  const ORG_A = 'org-a';
  const PRODUCT_ID = 'product-1';

  beforeEach(() => {
    tierRepository = {
      find: vi.fn(),
      create: vi.fn((input) => input),
      save: vi.fn((entity) => Promise.resolve(entity)),
      delete: vi.fn(),
    };
    productRepository = { exists: vi.fn() };

    service = new ProductPriceTiersService(tierRepository as never, productRepository as never);
  });

  it('findAllForProduct throws NotFoundException when the product is not in the caller org', async () => {
    productRepository.exists.mockResolvedValue(false);

    await expect(service.findAllForProduct(PRODUCT_ID, ORG_A)).rejects.toThrow(NotFoundException);
    expect(tierRepository.find).not.toHaveBeenCalled();
  });

  it('findAllForProduct orders by min_qty ascending, matching how tiers are read', async () => {
    productRepository.exists.mockResolvedValue(true);
    tierRepository.find.mockResolvedValue([]);

    await service.findAllForProduct(PRODUCT_ID, ORG_A);

    expect(tierRepository.find).toHaveBeenCalledWith({
      where: { productId: PRODUCT_ID, organizationId: ORG_A },
      order: { minQty: 'ASC' },
    });
  });

  it('create() does not accept or store a currency field — tiers always use the product base_currency', async () => {
    productRepository.exists.mockResolvedValue(true);

    const result = await service.create(PRODUCT_ID, { minQty: 100, maxQty: 500, unitPrice: 4.5 }, ORG_A);

    expect(result).not.toHaveProperty('currency');
    expect(result).toEqual({
      productId: PRODUCT_ID,
      organizationId: ORG_A,
      minQty: '100',
      maxQty: '500',
      unitPrice: '4.5',
    });
  });

  it('create() stores an open-ended tier (no upper limit) when maxQty is omitted', async () => {
    productRepository.exists.mockResolvedValue(true);

    const result = await service.create(PRODUCT_ID, { minQty: 1000, unitPrice: 3.32 }, ORG_A);

    expect(result.maxQty).toBeNull();
  });

  it('create() throws NotFoundException instead of touching the tier repository when the product is not owned', async () => {
    productRepository.exists.mockResolvedValue(false);

    await expect(service.create(PRODUCT_ID, { minQty: 1, unitPrice: 1 }, ORG_A)).rejects.toThrow(
      NotFoundException,
    );
    expect(tierRepository.create).not.toHaveBeenCalled();
    expect(tierRepository.save).not.toHaveBeenCalled();
  });

  it('remove() throws NotFoundException when no row matched (wrong org, wrong product, or wrong tier id)', async () => {
    productRepository.exists.mockResolvedValue(true);
    tierRepository.delete.mockResolvedValue({ affected: 0 });

    await expect(service.remove(PRODUCT_ID, 'tier-9', ORG_A)).rejects.toThrow(NotFoundException);
  });

  it('remove() succeeds silently when a row was deleted', async () => {
    productRepository.exists.mockResolvedValue(true);
    tierRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(service.remove(PRODUCT_ID, 'tier-1', ORG_A)).resolves.toBeUndefined();
    expect(tierRepository.delete).toHaveBeenCalledWith({
      id: 'tier-1',
      productId: PRODUCT_ID,
      organizationId: ORG_A,
    });
  });
});
