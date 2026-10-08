import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import type { StorageStrategy } from '../../storage/storage-strategy.interface.js';

// Focused tests for the storage-related ProductsService methods
// (requestImageUploadUrl / addImage / removeImage) — the integration point
// changed by introducing StorageStrategy. These prove ProductsService's
// behavior is unchanged from the reader's point of view: it was previously
// calling S3Service directly and is now calling whatever StorageStrategy is
// injected, with identical validation/error semantics either way. A mocked
// StorageStrategy stands in for both "S3/LocalStack" and "Cloudinary" here —
// ProductsService itself has no provider-specific logic to test.
describe('ProductsService storage integration', () => {
  function createStorageStrategyMock(): StorageStrategy {
    return {
      buildProductImageKey: vi.fn(),
      keyBelongsToProduct: vi.fn(),
      getPresignedUploadUrl: vi.fn(),
      getObjectMetadata: vi.fn(),
      delete: vi.fn(),
    };
  }

  function createService(storageStrategy: StorageStrategy) {
    const productRepository = { exists: vi.fn() };
    const productImageRepository = { findOne: vi.fn(), delete: vi.fn() };
    const dataSource = { transaction: vi.fn() };

    const service = new ProductsService(
      productRepository as never,
      {} as never, // priceTierRepository (unused by these methods)
      {} as never, // productCountryRepository (unused by these methods)
      productImageRepository as never,
      dataSource as never,
      storageStrategy,
    );

    return { service, productRepository, productImageRepository, dataSource };
  }

  describe('requestImageUploadUrl', () => {
    it('builds the key and presigned URL through the injected strategy', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.buildProductImageKey).mockReturnValue(
        'products/p1/uuid-photo.jpg',
      );
      vi.mocked(storageStrategy.getPresignedUploadUrl).mockResolvedValue(
        'https://upload.example/signed',
      );
      const { service, productRepository } = createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      const result = await service.requestImageUploadUrl(
        'p1',
        'photo.jpg',
        'image/jpeg',
      );

      expect(storageStrategy.buildProductImageKey).toHaveBeenCalledWith(
        'p1',
        'photo.jpg',
      );
      expect(storageStrategy.getPresignedUploadUrl).toHaveBeenCalledWith(
        'products/p1/uuid-photo.jpg',
        900,
        'image/jpeg',
      );
      expect(result).toEqual({
        uploadUrl: 'https://upload.example/signed',
        key: 'products/p1/uuid-photo.jpg',
        expiresInSeconds: 900,
      });
    });

    it('throws NotFoundException without calling the strategy when the product does not exist', async () => {
      const storageStrategy = createStorageStrategyMock();
      const { service, productRepository } = createService(storageStrategy);
      productRepository.exists.mockResolvedValue(false);

      await expect(
        service.requestImageUploadUrl('missing', 'photo.jpg', 'image/jpeg'),
      ).rejects.toThrow(NotFoundException);
      expect(storageStrategy.buildProductImageKey).not.toHaveBeenCalled();
    });
  });

  describe('addImage', () => {
    it('rejects an object key that does not belong to the product', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(false);
      const { service, productRepository } = createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      await expect(
        service.addImage('p1', { objectKey: 'products/other/x.jpg' }),
      ).rejects.toThrow(BadRequestException);
      expect(storageStrategy.getObjectMetadata).not.toHaveBeenCalled();
    });

    it('rejects when the object was never uploaded', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(true);
      vi.mocked(storageStrategy.getObjectMetadata).mockResolvedValue({
        exists: false,
      });
      const { service, productRepository } = createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      await expect(
        service.addImage('p1', { objectKey: 'products/p1/x.jpg' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deletes an oversized object via the strategy and rejects the request', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(true);
      vi.mocked(storageStrategy.getObjectMetadata).mockResolvedValue({
        exists: true,
        sizeBytes: 999_999_999,
      });
      const { service, productRepository } = createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      await expect(
        service.addImage('p1', { objectKey: 'products/p1/huge.jpg' }),
      ).rejects.toThrow(BadRequestException);
      expect(storageStrategy.delete).toHaveBeenCalledWith(
        'products/p1/huge.jpg',
      );
    });

    it('persists the image metadata when validation passes', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(true);
      vi.mocked(storageStrategy.getObjectMetadata).mockResolvedValue({
        exists: true,
        sizeBytes: 1024,
      });
      const { service, productRepository, dataSource } =
        createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      const savedImage = {
        id: 'img1',
        productId: 'p1',
        s3ObjectKey: 'products/p1/x.jpg',
        altText: null,
        isPrimary: false,
        sortOrder: 0,
      };
      const manager = {
        update: vi.fn(),
        create: vi.fn().mockReturnValue(savedImage),
        save: vi.fn().mockResolvedValue(savedImage),
      };
      dataSource.transaction.mockImplementation(
        async (fn: (m: typeof manager) => unknown) => fn(manager),
      );

      const result = await service.addImage('p1', {
        objectKey: 'products/p1/x.jpg',
      });

      expect(result).toEqual({
        id: 'img1',
        productId: 'p1',
        objectKey: 'products/p1/x.jpg',
        altText: null,
        isPrimary: false,
        sortOrder: 0,
      });
    });
  });

  describe('removeImage', () => {
    it('deletes the DB row then calls the strategy to delete the stored object', async () => {
      const storageStrategy = createStorageStrategyMock();
      const { service, productImageRepository } =
        createService(storageStrategy);
      productImageRepository.findOne.mockResolvedValue({
        id: 'img1',
        productId: 'p1',
        s3ObjectKey: 'products/p1/x.jpg',
      });

      await service.removeImage('p1', 'img1');

      expect(productImageRepository.delete).toHaveBeenCalledWith({
        id: 'img1',
      });
      expect(storageStrategy.delete).toHaveBeenCalledWith(
        'products/p1/x.jpg',
      );
    });

    it('throws NotFoundException without touching storage when the image row is missing', async () => {
      const storageStrategy = createStorageStrategyMock();
      const { service, productImageRepository } =
        createService(storageStrategy);
      productImageRepository.findOne.mockResolvedValue(null);

      await expect(service.removeImage('p1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(storageStrategy.delete).not.toHaveBeenCalled();
    });
  });
});
