import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity.js';
import { ProductCountry } from '../../database/entities/product-country.entity.js';
import { ProductImage } from '../../database/entities/product-image.entity.js';
import { ProductPriceTier } from '../../database/entities/product-price-tier.entity.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ProductDetailDto, toProductDetailDto } from '../../common/dto/product-detail.dto.js';
import { toProductImageResponseDto } from '../products/dto/product-image-response.dto.js';
import type { QueryPublicProductsDto } from './dto/query-public-products.dto.js';

const PUBLISHED = 'PUBLISHED';

// Public catalogue — section 12. Every query here is unconditionally
// scoped to status = PUBLISHED. This is the one server-side boundary that
// must never be bypassed by a client-supplied filter — see API spec
// section 10/14 and marketplace-domain.md: "UI filtering alone is not a
// security or publication boundary."
@Injectable()
export class PublicProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductPriceTier)
    private readonly priceTierRepository: Repository<ProductPriceTier>,
    @InjectRepository(ProductCountry)
    private readonly productCountryRepository: Repository<ProductCountry>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async findAll(query: QueryPublicProductsDto): Promise<PaginatedResponseDto<Product>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .leftJoinAndSelect('product.sourceCountry', 'sourceCountry')
      .where('product.status = :status', { status: PUBLISHED });

    if (query.search) {
      qb.andWhere('product.name ILIKE :search', { search: `%${query.search}%` });
    }
    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (query.sourceCountryId) {
      qb.andWhere('product.sourceCountryId = :sourceCountryId', { sourceCountryId: query.sourceCountryId });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }
    if (query.minMoq !== undefined) {
      qb.andWhere('product.moq >= :minMoq', { minMoq: query.minMoq });
    }
    if (query.maxMoq !== undefined) {
      qb.andWhere('product.moq <= :maxMoq', { maxMoq: query.maxMoq });
    }

    switch (query.sort) {
      case 'price_asc':
        qb.orderBy('product.price', 'ASC', 'NULLS LAST');
        break;
      case 'price_desc':
        qb.orderBy('product.price', 'DESC', 'NULLS LAST');
        break;
      case 'newest':
      default:
        qb.orderBy('product.createdAt', 'DESC');
        break;
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, totalItems] = await qb.getManyAndCount();

    return {
      items,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  // Section 12.2. If the slug belongs to a DRAFT product, this responds
  // 404 — identical to a nonexistent slug — rather than exposing the
  // draft or leaking that a matching-but-unpublished product exists.
  async findOneBySlug(slug: string): Promise<ProductDetailDto> {
    const product = await this.productRepository.findOne({
      where: { slug, status: PUBLISHED },
      relations: ['category', 'vendor', 'sourceCountry'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [images, priceTiers, productCountries] = await Promise.all([
      this.productImageRepository.find({ where: { productId: product.id }, order: { sortOrder: 'ASC' } }),
      this.priceTierRepository.find({ where: { productId: product.id }, order: { minQuantity: 'ASC' } }),
      this.productCountryRepository.find({ where: { productId: product.id }, relations: ['country'] }),
    ]);

    return toProductDetailDto(
      product,
      images.map(toProductImageResponseDto),
      priceTiers,
      productCountries.map((pc) => pc.country),
    );
  }
}
