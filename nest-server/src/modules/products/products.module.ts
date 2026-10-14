import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../database/entities/product.entity.js';
import { ProductCountry } from '../../database/entities/product-country.entity.js';
import { ProductImage } from '../../database/entities/product-image.entity.js';
import { ProductPriceTier } from '../../database/entities/product-price-tier.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

// Does NOT import AuthModule: JwtAuthGuard resolves Passport's 'jwt'
// strategy from Passport's global registry (not module-scoped Nest DI),
// and PermissionsGuard only depends on Reflector (globally available).
// Neither guard needs AuthModule's provider graph to work via
// @UseGuards(...) — importing it here would be dead wiring.
//
// Does NOT import AwsModule either: it's @Global() (see
// src/aws/aws.module.ts), registered once in AppModule, so S3Service is
// already injectable here without a module-level import.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductPriceTier,
      ProductCountry,
      ProductImage,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
