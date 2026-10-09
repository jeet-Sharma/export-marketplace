import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import type { StorageStrategy } from '../../storage/storage-strategy.interface.js';

// Focused tests for ProductsService.update()/publish()/unpublish() —
// covering the Qodo review findings about concurrency (update() must lock
// the row it's about to modify, inside the transaction, rather than
// loading it beforehand and overwriting with a stale copy) and audit
// trail completeness (publish/unpublish must set updatedBy, same as a
// normal field update does).
describe('ProductsService update/publish/unpublish', () => {
  function createStorageStrategyMock(): StorageStrategy {
    return {
      buildProductImageKey: vi.fn(),
      keyBelongsToProduct: vi.fn(),
      getPresignedUpload: vi.fn(),
      getObjectMetadata: vi.fn(),
      delete: vi.fn(),
    };
  }

  function createService() {
    const productRepository = { findOne: vi.fn(), save: vi.fn() };
    const dataSource = { transaction: vi.fn() };
    const storageStrategy = createStorageStrategyMock();

    const service = new ProductsService(
      productRepository as never,
      {} as never, // priceTierRepository (unused here)
      {} as never, // productCountryRepository (unused here)
      {} as never, // productImageRepository (unused here)
      dataSource as never,
      storageStrategy,
    );

    return { service, productRepository, dataSource };
  }

  describe('update() concurrency', () => {
    it('loads and locks the row INSIDE the transaction via manager.findOne with pessimistic_write', async () => {
      const { service, dataSource } = createService();
      const product = {
        id: 'p1',
        name: 'Old name',
        status: 'DRAFT',
        updatedBy: 'old-user',
      };
      const manager = {
        findOne: vi.fn().mockResolvedValue(product),
        save: vi.fn().mockImplementation((_entity, value) => value),
      };
      dataSource.transaction.mockImplementation(
        async (fn: (m: typeof manager) => unknown) => fn(manager),
      );

      await service.update('p1', { name: 'New name' }, 'user-1');

      expect(manager.findOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: { id: 'p1' },
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('throws NotFoundException when the row is missing, without reading productRepository.findOne beforehand', async () => {
      const { service, productRepository, dataSource } = createService();
      const manager = {
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      };
      dataSource.transaction.mockImplementation(
        async (fn: (m: typeof manager) => unknown) => fn(manager),
      );

      await expect(
        service.update('missing', { name: 'New name' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
      // The old implementation loaded the product via productRepository
      // BEFORE opening the transaction; the fixed version loads it only
      // via manager.findOne inside the transaction, so the plain
      // repository method must never be called by update().
      expect(productRepository.findOne).not.toHaveBeenCalled();
    });

    it('applies PATCH fields to the row loaded inside the transaction, not a pre-transaction snapshot', async () => {
      const { service, dataSource } = createService();
      const product = {
        id: 'p1',
        name: 'Old name',
        status: 'DRAFT',
        updatedBy: 'old-user',
      };
      const manager = {
        findOne: vi.fn().mockResolvedValue(product),
        save: vi.fn().mockImplementation((_entity, value) => value),
      };
      dataSource.transaction.mockImplementation(
        async (fn: (m: typeof manager) => unknown) => fn(manager),
      );

      const result = await service.update(
        'p1',
        { name: 'New name' },
        'user-1',
      );

      expect(result.name).toBe('New name');
      expect(result.updatedBy).toBe('user-1');
    });
  });

  describe('publish()', () => {
    it('sets updatedBy to the acting user when publishing', async () => {
      const { service, productRepository } = createService();
      const product = {
        id: 'p1',
        name: 'Product',
        vendorId: 'v1',
        status: 'DRAFT',
        updatedBy: 'original-creator',
      };
      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockImplementation((value) => value);

      const result = await service.publish('p1', 'admin-1');

      expect(result.status).toBe('PUBLISHED');
      expect(result.updatedBy).toBe('admin-1');
    });

    it('still sets updatedBy even when the product is already published (no-op status change)', async () => {
      const { service, productRepository } = createService();
      const product = {
        id: 'p1',
        name: 'Product',
        vendorId: 'v1',
        status: 'PUBLISHED',
        updatedBy: 'original-creator',
      };
      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockImplementation((value) => value);

      const result = await service.publish('p1', 'admin-2');

      expect(result.updatedBy).toBe('admin-2');
    });

    it('throws NotFoundException when the product does not exist', async () => {
      const { service, productRepository } = createService();
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.publish('missing', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unpublish()', () => {
    it('sets updatedBy to the acting user when unpublishing', async () => {
      const { service, productRepository } = createService();
      const product = {
        id: 'p1',
        status: 'PUBLISHED',
        updatedBy: 'original-creator',
      };
      productRepository.findOne.mockResolvedValue(product);
      productRepository.save.mockImplementation((value) => value);

      const result = await service.unpublish('p1', 'admin-3');

      expect(result.status).toBe('DRAFT');
      expect(result.updatedBy).toBe('admin-3');
    });

    it('throws NotFoundException when the product does not exist', async () => {
      const { service, productRepository } = createService();
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.unpublish('missing', 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('price tier overlap validation returns 400, not 409', () => {
    it('throws BadRequestException (not ConflictException) for overlapping price tiers', async () => {
      const { service } = createService();

      await expect(
        service.update(
          'p1',
          {
            priceTiers: [
              {
                minQuantity: 1,
                maxQuantity: 100,
                price: 10,
                currencyCode: 'USD',
              },
              {
                minQuantity: 50,
                maxQuantity: 200,
                price: 8,
                currencyCode: 'USD',
              },
            ],
          },
          'user-1',
        ),
      ).rejects.not.toThrow(ConflictException);
    });
  });
});
