import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductMediaEntity } from './entities/product-media.entity.js';
import { ProductEntity } from './entities/product.entity.js';
import { CreateProductMediaDto } from './dto/create-product-media.dto.js';

/**
 * Part 3.4 — product_media. Only one row per product may have
 * is_primary = true (media_one_primary partial unique index,
 * CreateVendorCatalog1732800000003) — this service does not pre-clear the
 * previous primary before insert; a caller switching the primary image is
 * expected to unset the old one first (DELETE + re-create, or a future
 * PATCH), matching what the migration actually enforces rather than
 * adding an auto-swap behavior the schema doesn't specify.
 */
@Injectable()
export class ProductMediaService {
  constructor(
    @InjectRepository(ProductMediaEntity)
    private readonly mediaRepository: Repository<ProductMediaEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async findAllForProduct(productId: string, organizationId: string): Promise<ProductMediaEntity[]> {
    await this.assertProductInOrg(productId, organizationId);
    return this.mediaRepository.find({ where: { productId, organizationId }, order: { sortOrder: 'ASC' } });
  }

  async create(
    productId: string,
    dto: CreateProductMediaDto,
    organizationId: string,
  ): Promise<ProductMediaEntity> {
    await this.assertProductInOrg(productId, organizationId);

    const media = this.mediaRepository.create({
      productId,
      organizationId,
      mediaType: dto.mediaType,
      storageKey: dto.storageKey,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes.toString(),
      sha256: dto.sha256,
      isPrimary: dto.isPrimary ?? false,
      sortOrder: dto.sortOrder ?? 0,
    });
    return this.mediaRepository.save(media);
  }

  async remove(productId: string, mediaId: string, organizationId: string): Promise<void> {
    await this.assertProductInOrg(productId, organizationId);

    const result = await this.mediaRepository.delete({ id: mediaId, productId, organizationId });
    if (result.affected === 0) {
      throw new NotFoundException(`Media ${mediaId} not found on product ${productId}`);
    }
  }

  private async assertProductInOrg(productId: string, organizationId: string): Promise<void> {
    const exists = await this.productRepository.exists({ where: { id: productId, organizationId } });
    if (!exists) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
  }
}
