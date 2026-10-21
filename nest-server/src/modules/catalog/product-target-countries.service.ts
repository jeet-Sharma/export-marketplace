import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTargetCountryEntity } from './entities/product-target-country.entity.js';
import { ProductEntity } from './entities/product.entity.js';
import { VendorTargetCountryEntity } from '../identity/entities/vendor-target-country.entity.js';
import { UpsertTargetCountryDto } from './dto/upsert-target-country.dto.js';

/**
 * Part 3.2 — product_target_country, H-16: "a product's countries must
 * come from its vendor's own list" (Document 4 rule B.4.1). The migration
 * enforces this with a composite FK to vendor_target_country
 * (organization_id, target_country) — this service checks the same
 * condition up front so a vendor gets a clear 400 instead of a raw FK
 * violation from the database.
 */
@Injectable()
export class ProductTargetCountriesService {
  constructor(
    @InjectRepository(ProductTargetCountryEntity)
    private readonly targetCountryRepository: Repository<ProductTargetCountryEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(VendorTargetCountryEntity)
    private readonly vendorTargetCountryRepository: Repository<VendorTargetCountryEntity>,
  ) {}

  async findAllForProduct(productId: string, organizationId: string): Promise<ProductTargetCountryEntity[]> {
    await this.assertProductInOrg(productId, organizationId);
    return this.targetCountryRepository.find({ where: { productId, organizationId } });
  }

  /**
   * Creates or updates the row for one target country on a product.
   * UNIQUE(product_id, target_country) means there is at most one row per
   * pair, so this is naturally an upsert keyed by the country code in the
   * URL, not a POST-then-PATCH pair of endpoints.
   */
  async upsert(
    productId: string,
    countryCode: string,
    dto: UpsertTargetCountryDto,
    organizationId: string,
  ): Promise<ProductTargetCountryEntity> {
    await this.assertProductInOrg(productId, organizationId);

    const vendorAllowsCountry = await this.vendorTargetCountryRepository.exists({
      where: { organizationId, targetCountry: countryCode },
    });
    if (!vendorAllowsCountry) {
      throw new BadRequestException(
        `Organization ${organizationId} has not declared ${countryCode} as a target country — add it to vendor_target_country first.`,
      );
    }

    const existing = await this.targetCountryRepository.findOne({
      where: { productId, organizationId, targetCountry: countryCode },
    });

    const row =
      existing ??
      this.targetCountryRepository.create({ productId, organizationId, targetCountry: countryCode });

    row.nationalTariffCode = dto.nationalTariffCode ?? row.nationalTariffCode ?? null;
    row.isAllowed = dto.isAllowed;
    row.blockReason = dto.isAllowed ? null : (dto.blockReason ?? null);

    return this.targetCountryRepository.save(row);
  }

  async remove(productId: string, countryCode: string, organizationId: string): Promise<void> {
    await this.assertProductInOrg(productId, organizationId);

    const result = await this.targetCountryRepository.delete({
      productId,
      organizationId,
      targetCountry: countryCode,
    });
    if (result.affected === 0) {
      throw new NotFoundException(`Target country ${countryCode} not found on product ${productId}`);
    }
  }

  private async assertProductInOrg(productId: string, organizationId: string): Promise<void> {
    const exists = await this.productRepository.exists({ where: { id: productId, organizationId } });
    if (!exists) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
  }
}
