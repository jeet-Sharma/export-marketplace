import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './entities/product.entity.js';
import { ProductTargetCountryEntity } from './entities/product-target-country.entity.js';
import { ProductPriceTierEntity } from './entities/product-price-tier.entity.js';
import { ProductMediaEntity } from './entities/product-media.entity.js';
import { ProductApprovalLogEntity } from './entities/product-approval-log.entity.js';
import { IdentityModule } from '../identity/identity.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { ProductPriceTiersService } from './product-price-tiers.service.js';
import { ProductPriceTiersController } from './product-price-tiers.controller.js';
import { ProductTargetCountriesService } from './product-target-countries.service.js';
import { ProductTargetCountriesController } from './product-target-countries.controller.js';
import { ProductMediaService } from './product-media.service.js';
import { ProductMediaController } from './product-media.controller.js';
import { ProductApprovalLogService } from './product-approval-log.service.js';

/**
 * PART 3 — Vendor Catalog (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Registers the 5 catalog entities as TypeORM entities: product,
 * product_target_country, product_price_tier, product_media,
 * product_approval_log — plus the services/controllers implementing the
 * Maker -> Checker -> Admin approval workflow (Part 3.1) and the three
 * child resources (price tiers, target countries, media).
 *
 * IdentityModule is imported for OrganizationEntity (self-approval's
 * requires_second_approver lookup, ProductsService) and
 * VendorTargetCountryEntity (H-16's vendor-country pre-check,
 * ProductTargetCountriesService) — both entities are owned by that
 * module, made injectable here the standard way (its exported
 * TypeOrmModule re-export), not duplicated.
 *
 * InventoryModule is imported so ProductsService.create() can open the
 * matching `inventory` row (quantity 0) in the same transaction as the
 * product insert — otherwise the first stock adjustment for a brand new
 * product 404s (no inventory row exists to update).
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
    IdentityModule,
    InventoryModule,
  ],
  controllers: [
    ProductsController,
    ProductPriceTiersController,
    ProductTargetCountriesController,
    ProductMediaController,
  ],
  providers: [
    ProductsService,
    ProductPriceTiersService,
    ProductTargetCountriesService,
    ProductMediaService,
    ProductApprovalLogService,
  ],
  exports: [TypeOrmModule],
})
export class CatalogModule {}
