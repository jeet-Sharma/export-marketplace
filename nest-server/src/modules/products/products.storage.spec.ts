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
      getPresignedUpload: vi.fn(),
      getObjectMetadata: vi.fn(),
      delete: vi.fn(),
      getDisplayUrl: vi.fn().mockResolvedValue('https://display.example/image.jpg'),
    };
  }

  function createService(storageStrategy: StorageStrategy) {
    const productRepository = { exists: vi.fn() };
    const productImageRepository = {
      findOne: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn().mockResolvedValue(false),
    };
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
    it('builds the key and presigned upload through the injected strategy, capping size at MAX_IMAGE_UPLOAD_BYTES', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.buildProductImageKey).mockReturnValue(
        'products/p1/uuid-photo.jpg',
      );
      vi.mocked(storageStrategy.getPresignedUpload).mockResolvedValue({
        url: 'https://upload.example/signed',
        httpMethod: 'POST',
        fields: { key: 'products/p1/uuid-photo.jpg' },
        expiresInSeconds: 900,
      });
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
      expect(storageStrategy.getPresignedUpload).toHaveBeenCalledWith(
        'products/p1/uuid-photo.jpg',
        900,
        5 * 1024 * 1024,
        'image/jpeg',
      );
      expect(result).toEqual({
        uploadUrl: 'https://upload.example/signed',
        httpMethod: 'POST',
        fields: { key: 'products/p1/uuid-photo.jpg' },
        key: 'products/p1/uuid-photo.jpg',
        expiresInSeconds: 900,
      });
    });

    it('relays the strategy-reported expiresInSeconds, not the requested TTL constant, when they differ (e.g. Cloudinary)', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.buildProductImageKey).mockReturnValue(
        'products/p1/uuid-photo.jpg',
      );
      vi.mocked(storageStrategy.getPresignedUpload).mockResolvedValue({
        url: 'https://api.cloudinary.com/v1_1/demo/image/upload',
        httpMethod: 'POST',
        fields: { public_id: 'products/p1/uuid-photo.jpg' },
        // Cloudinary's actual enforced window, independent of the 900s
        // requested by ProductsService (PRESIGNED_UPLOAD_URL_TTL_SECONDS).
        expiresInSeconds: 3600,
      });
      const { service, productRepository } = createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      const result = await service.requestImageUploadUrl(
        'p1',
        'photo.jpg',
        'image/jpeg',
      );

      expect(result.expiresInSeconds).toBe(3600);
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

    it('rejects an objectKey that is already attached to another image (409)', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(true);
      const { service, productRepository, productImageRepository } =
        createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);
      productImageRepository.exists.mockResolvedValue(true);

      await expect(
        service.addImage('p1', { objectKey: 'products/p1/dup.jpg' }),
      ).rejects.toMatchObject({ status: 409 });
      // Short-circuits before even checking storage for the object.
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

    it('rejects when the uploaded content does not match an allowed image type', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(true);
      vi.mocked(storageStrategy.getObjectMetadata).mockResolvedValue({
        exists: true,
        sizeBytes: 1024,
        detectedContentType: undefined,
      });
      const { service, productRepository } = createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      await expect(
        service.addImage('p1', { objectKey: 'products/p1/not-an-image.jpg' }),
      ).rejects.toThrow(BadRequestException);
      expect(storageStrategy.delete).toHaveBeenCalledWith(
        'products/p1/not-an-image.jpg',
      );
    });

    it('persists the image metadata when validation passes, including the resolved display url', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(true);
      vi.mocked(storageStrategy.getObjectMetadata).mockResolvedValue({
        exists: true,
        sizeBytes: 1024,
        detectedContentType: 'image/jpeg',
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
        url: 'https://display.example/image.jpg',
        altText: null,
        isPrimary: false,
        sortOrder: 0,
      });
    });

    it('converts a lost race on UQ_product_images_s3_object_key into a 409 naming objectKey', async () => {
      const storageStrategy = createStorageStrategyMock();
      vi.mocked(storageStrategy.keyBelongsToProduct).mockReturnValue(true);
      vi.mocked(storageStrategy.getObjectMetadata).mockResolvedValue({
        exists: true,
        sizeBytes: 1024,
        detectedContentType: 'image/jpeg',
      });
      const { service, productRepository, dataSource } =
        createService(storageStrategy);
      productRepository.exists.mockResolvedValue(true);

      const queryFailedError = Object.assign(
        new Error('duplicate key value violates unique constraint'),
        {
          name: 'QueryFailedError',
          driverError: {
            code: '23505',
            constraint: 'UQ_product_images_s3_object_key',
          },
        },
      );
      // Make it pass instanceof QueryFailedError checks used by the
      // service without importing typeorm's class directly here.
      const { QueryFailedError } = await import('typeorm');
      Object.setPrototypeOf(queryFailedError, QueryFailedError.prototype);

      dataSource.transaction.mockRejectedValue(queryFailedError);

      await expect(
        service.addImage('p1', { objectKey: 'products/p1/race.jpg' }),
      ).rejects.toMatchObject({
        status: 409,
        response: expect.objectContaining({
          errors: [
            expect.objectContaining({ field: 'objectKey' }),
          ],
        }),
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

    it('does not throw when the storage delete fails after the DB row is already removed', async () => {
      const storageStrategy = createStorageStrategyMock();
      const { service, productImageRepository } =
        createService(storageStrategy);
      productImageRepository.findOne.mockResolvedValue({
        id: 'img1',
        productId: 'p1',
        s3ObjectKey: 'products/p1/x.jpg',
      });
      vi.mocked(storageStrategy.delete).mockRejectedValue(
        new Error('storage provider unavailable'),
      );

      // The DB delete must still have happened, and the method must
      // resolve successfully — a storage-layer failure after the DB row
      // is gone must not turn into an API error.
      await expect(service.removeImage('p1', 'img1')).resolves.toBeUndefined();
      expect(productImageRepository.delete).toHaveBeenCalledWith({
        id: 'img1',
      });
    });
  });
});
