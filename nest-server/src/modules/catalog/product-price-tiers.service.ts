import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductPriceTierEntity } from './entities/product-price-tier.entity.js';
import { ProductEntity } from './entities/product.entity.js';
import { CreatePriceTierDto } from './dto/create-price-tier.dto.js';

/**
 * Part 3.3 — product_price_tier. min_qty/max_qty overlap on the same
 * product is refused by the DB (tier_no_overlap GiST exclusion
 * constraint, CreateVendorCatalog1732800000003) — this service does not
 * duplicate that check; a violation propagates as a driver error.
 *
 * currency is not a field here: a tier always prices in the parent
 * product's base_currency, so there is nothing to accept or store for it
 * (Part 3.3's "Why").
 */
@Injectable()
export class ProductPriceTiersService {
  constructor(
    @InjectRepository(ProductPriceTierEntity)
    private readonly tierRepository: Repository<ProductPriceTierEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async findAllForProduct(productId: string, organizationId: string): Promise<ProductPriceTierEntity[]> {
    await this.assertProductInOrg(productId, organizationId);
    return this.tierRepository.find({ where: { productId, organizationId }, order: { minQty: 'ASC' } });
  }

  async create(
    productId: string,
    dto: CreatePriceTierDto,
    organizationId: string,
  ): Promise<ProductPriceTierEntity> {
    await this.assertProductInOrg(productId, organizationId);

    const tier = this.tierRepository.create({
      productId,
      organizationId,
      minQty: dto.minQty.toString(),
      maxQty: dto.maxQty?.toString() ?? null,
      unitPrice: dto.unitPrice.toString(),
    });
    return this.tierRepository.save(tier);
  }

  async remove(productId: string, tierId: string, organizationId: string): Promise<void> {
    await this.assertProductInOrg(productId, organizationId);

    const result = await this.tierRepository.delete({ id: tierId, productId, organizationId });
    if (result.affected === 0) {
      throw new NotFoundException(`Price tier ${tierId} not found on product ${productId}`);
    }
  }

  /** Confirms the parent product exists and belongs to the caller's organization before touching its tiers. */
  private async assertProductInOrg(productId: string, organizationId: string): Promise<void> {
    const exists = await this.productRepository.exists({ where: { id: productId, organizationId } });
    if (!exists) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
  }
}
