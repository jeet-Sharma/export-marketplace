import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity.js';
import { ProductTargetCountryEntity } from './entities/product-target-country.entity.js';
import { ProductPriceTierEntity } from './entities/product-price-tier.entity.js';
import { ProductMediaEntity } from './entities/product-media.entity.js';
import { ProductApprovalLogEntity } from './entities/product-approval-log.entity.js';

/**
 * PART 3 — Vendor Catalog (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Registers the 5 catalog entities as TypeORM entities: product,
 * product_target_country, product_price_tier, product_media,
 * product_approval_log.
 *
 * No controller or service yet — this is a database-schema-only pass (see
 * the CreateVendorCatalog migration for the actual schema). No
 * self-approval enforcement, no submit-time tier-gap validation, no
 * search indexing beyond the generated tsvector column, and no bootstrap
 * data (no sample products) are implemented here.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductTargetCountryEntity,
      ProductPriceTierEntity,
      ProductMediaEntity,
      ProductApprovalLogEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class CatalogModule {}
