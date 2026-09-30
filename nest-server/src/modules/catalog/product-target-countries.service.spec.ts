import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductTargetCountriesService } from './product-target-countries.service.js';

/**
 * Unit tests for ProductTargetCountriesService (Part 3.2, H-16). The
 * migration enforces "a product's countries must come from its vendor's
 * own list" with a composite FK to vendor_target_country — these tests
 * verify the service's own app-level pre-check (a clear 400 instead of a
 * raw FK violation) and its organization scoping, not the DB constraint
 * itself.
 */
describe('ProductTargetCountriesService', () => {
  const ORG_A = 'org-a';
  const PRODUCT_ID = 'product-1';

  let targetCountryRepository: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let productRepository: { exists: ReturnType<typeof vi.fn> };
  let vendorTargetCountryRepository: { exists: ReturnType<typeof vi.fn> };
  let service: ProductTargetCountriesService;

  beforeEach(() => {
    targetCountryRepository = {
      find: vi.fn(),
      findOne: vi.fn(),
      // create() returns a FRESH object (not the same reference passed
      // in) — the service mutates the returned row afterward
      // (isAllowed/blockReason/nationalTariffCode), and vi.fn()'s call
      // history records a reference, not a snapshot, so echoing the same
      // object back would make assertions on the recorded call see the
      // post-mutation state instead of what was actually passed in.
      create: vi.fn((input) => ({ ...input })),
      save: vi.fn((entity) => Promise.resolve(entity)),
      delete: vi.fn(),
    };
    productRepository = { exists: vi.fn().mockResolvedValue(true) };
    vendorTargetCountryRepository = { exists: vi.fn().mockResolvedValue(true) };

    service = new ProductTargetCountriesService(
      targetCountryRepository as never,
      productRepository as never,
      vendorTargetCountryRepository as never,
    );
  });

  describe('organization scoping', () => {
    it('findAllForProduct throws NotFoundException when the product is not in the caller org', async () => {
      productRepository.exists.mockResolvedValue(false);

      await expect(service.findAllForProduct(PRODUCT_ID, ORG_A)).rejects.toThrow(NotFoundException);
      expect(targetCountryRepository.find).not.toHaveBeenCalled();
    });

    it('findAllForProduct scopes the query by productId and organizationId', async () => {
      targetCountryRepository.find.mockResolvedValue([]);

      await service.findAllForProduct(PRODUCT_ID, ORG_A);

      expect(targetCountryRepository.find).toHaveBeenCalledWith({
        where: { productId: PRODUCT_ID, organizationId: ORG_A },
      });
    });

    it('remove throws NotFoundException when the product is not in the caller org, without touching the row', async () => {
      productRepository.exists.mockResolvedValue(false);

      await expect(service.remove(PRODUCT_ID, 'US', ORG_A)).rejects.toThrow(NotFoundException);
      expect(targetCountryRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('upsert() — H-16 vendor-country pre-check', () => {
    it('rejects a country the organization has not declared in vendor_target_country', async () => {
      vendorTargetCountryRepository.exists.mockResolvedValue(false);

      await expect(
        service.upsert(PRODUCT_ID, 'US', { isAllowed: true }, ORG_A),
      ).rejects.toThrow(BadRequestException);
      expect(targetCountryRepository.save).not.toHaveBeenCalled();
    });

    it('checks vendor_target_country scoped by organizationId and the target country code', async () => {
      targetCountryRepository.findOne.mockResolvedValue(null);

      await service.upsert(PRODUCT_ID, 'US', { isAllowed: true }, ORG_A);

      expect(vendorTargetCountryRepository.exists).toHaveBeenCalledWith({
        where: { organizationId: ORG_A, targetCountry: 'US' },
      });
    });

    it('creates a new row when none exists yet for this product/country pair', async () => {
      targetCountryRepository.findOne.mockResolvedValue(null);

      const result = await service.upsert(
        PRODUCT_ID,
        'US',
        { isAllowed: true, nationalTariffCode: '0910300000' },
        ORG_A,
      );

      // create() is called with just the identity fields — isAllowed/
      // blockReason/nationalTariffCode are set on the returned object
      // afterward (same shape for a fresh row or an existing one).
      expect(targetCountryRepository.create).toHaveBeenCalledWith({
        productId: PRODUCT_ID,
        organizationId: ORG_A,
        targetCountry: 'US',
      });
      expect(result.isAllowed).toBe(true);
      expect(result.blockReason).toBeNull();
      expect(result.nationalTariffCode).toBe('0910300000');
    });

    it('updates the existing row in place instead of creating a duplicate', async () => {
      const existing = {
        id: 'ptc-1',
        productId: PRODUCT_ID,
        organizationId: ORG_A,
        targetCountry: 'US',
        nationalTariffCode: 'old-code',
        isAllowed: true,
        blockReason: null,
      };
      targetCountryRepository.findOne.mockResolvedValue(existing);

      const result = await service.upsert(PRODUCT_ID, 'US', { isAllowed: true }, ORG_A);

      expect(targetCountryRepository.create).not.toHaveBeenCalled();
      expect(result).toBe(existing);
      // nationalTariffCode wasn't in this dto, so the prior value is kept.
      expect(result.nationalTariffCode).toBe('old-code');
    });

    it('clears block_reason when isAllowed is set to true', async () => {
      targetCountryRepository.findOne.mockResolvedValue({
        id: 'ptc-1',
        productId: PRODUCT_ID,
        organizationId: ORG_A,
        targetCountry: 'US',
        isAllowed: false,
        blockReason: 'Sanctioned at the time',
      });

      const result = await service.upsert(PRODUCT_ID, 'US', { isAllowed: true }, ORG_A);

      expect(result.blockReason).toBeNull();
    });

    it('stores block_reason when isAllowed is false (mirrors the migration CHECK)', async () => {
      targetCountryRepository.findOne.mockResolvedValue(null);

      const result = await service.upsert(
        PRODUCT_ID,
        'IR',
        { isAllowed: false, blockReason: 'Under export sanctions' },
        ORG_A,
      );

      expect(result.isAllowed).toBe(false);
      expect(result.blockReason).toBe('Under export sanctions');
    });
  });
});
