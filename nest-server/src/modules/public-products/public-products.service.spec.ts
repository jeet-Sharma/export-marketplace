import { NotFoundException } from '@nestjs/common';
import { PublicProductsService } from './public-products.service.js';
import type { StorageStrategy } from '../../storage/storage-strategy.interface.js';

// Qodo review Bug #13: GET /products (list) previously returned bare
// Product rows with zero image data, and GET /products/:slug (detail)
// returned images with only a bare, unusable storage key — no client
// could actually display a product image from either endpoint. These
// tests verify: (1) the list endpoint resolves one display URL per
// product via a single batched query (not N+1), and (2) the detail
// endpoint resolves a display URL for every image.
describe('PublicProductsService', () => {
  function createStorageStrategyMock(): StorageStrategy {
    return {
      buildProductImageKey: vi.fn(),
      keyBelongsToProduct: vi.fn(),
      getPresignedUpload: vi.fn(),
      getObjectMetadata: vi.fn(),
      delete: vi.fn(),
      getDisplayUrl: vi
        .fn()
        .mockImplementation(async (key: string) => `https://cdn.example/${key}`),
    };
  }

  function createQueryBuilderMock(products: unknown[], totalItems: number) {
    const qb = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([products, totalItems]),
    };
    return qb;
  }

  function createService(storageStrategy: StorageStrategy) {
    const productImageRepository = { find: vi.fn().mockResolvedValue([]) };
    const productRepository = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
    };
    const priceTierRepository = { find: vi.fn().mockResolvedValue([]) };
    const productCountryRepository = { find: vi.fn().mockResolvedValue([]) };

    const service = new PublicProductsService(
      productRepository as never,
      priceTierRepository as never,
      productCountryRepository as never,
      productImageRepository as never,
      storageStrategy,
    );

    return {
      service,
      productRepository,
      productImageRepository,
      priceTierRepository,
      productCountryRepository,
    };
  }

  describe('findAll', () => {
    it('resolves a primaryImageUrl per product using a single batched image query', async () => {
      const storageStrategy = createStorageStrategyMock();
      const products = [
        { id: 'p1', name: 'Product 1' },
        { id: 'p2', name: 'Product 2' },
      ];
      const { service, productRepository, productImageRepository } =
        createService(storageStrategy);
      const qb = createQueryBuilderMock(products, 2);
      productRepository.createQueryBuilder.mockReturnValue(qb);
      productImageRepository.find.mockResolvedValue([
        { productId: 'p1', s3ObjectKey: 'products/p1/primary.jpg' },
      ]);

      const result = await service.findAll({});

      // One query.find call for the whole page's primary images, not one
      // per product — confirms the batching, not N+1 round-trips.
      expect(productImageRepository.find).toHaveBeenCalledTimes(1);
      expect(storageStrategy.getDisplayUrl).toHaveBeenCalledTimes(1);
      expect(result.items).toEqual([
        { id: 'p1', name: 'Product 1', primaryImageUrl: 'https://cdn.example/products/p1/primary.jpg' },
        { id: 'p2', name: 'Product 2', primaryImageUrl: null },
      ]);
    });

    it('skips the image query entirely when the page has no products', async () => {
      const storageStrategy = createStorageStrategyMock();
      const { service, productRepository, productImageRepository } =
        createService(storageStrategy);
      const qb = createQueryBuilderMock([], 0);
      productRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({});

      expect(productImageRepository.find).not.toHaveBeenCalled();
      expect(result.items).toEqual([]);
    });
  });

  describe('findOneBySlug', () => {
    it('resolves a display url for every image via the injected storage strategy', async () => {
      const storageStrategy = createStorageStrategyMock();
      const { service, productRepository, productImageRepository } =
        createService(storageStrategy);
      productRepository.findOne.mockResolvedValue({
        id: 'p1',
        slug: 'turmeric',
      });
      productImageRepository.find.mockResolvedValue([
        {
          id: 'img1',
          productId: 'p1',
          s3ObjectKey: 'products/p1/a.jpg',
          altText: null,
          isPrimary: true,
          sortOrder: 0,
        },
      ]);

      const result = await service.findOneBySlug('turmeric');

      expect(storageStrategy.getDisplayUrl).toHaveBeenCalledWith(
        'products/p1/a.jpg',
        3600,
      );
      expect(result.images).toEqual([
        {
          id: 'img1',
          productId: 'p1',
          objectKey: 'products/p1/a.jpg',
          url: 'https://cdn.example/products/p1/a.jpg',
          altText: null,
          isPrimary: true,
          sortOrder: 0,
        },
      ]);
    });

    it('throws NotFoundException for a non-existent or unpublished slug', async () => {
      const storageStrategy = createStorageStrategyMock();
      const { service, productRepository } = createService(storageStrategy);
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneBySlug('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(storageStrategy.getDisplayUrl).not.toHaveBeenCalled();
    });
  });
});
