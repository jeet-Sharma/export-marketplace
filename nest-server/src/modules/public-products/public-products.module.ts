import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../database/entities/product.entity.js';
import { ProductCountry } from '../../database/entities/product-country.entity.js';
import { ProductImage } from '../../database/entities/product-image.entity.js';
import { ProductPriceTier } from '../../database/entities/product-price-tier.entity.js';
import { PublicProductsController } from './public-products.controller.js';
import { PublicProductsService } from './public-products.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductPriceTier, ProductCountry, ProductImage])],
  controllers: [PublicProductsController],
  providers: [PublicProductsService],
})
export class PublicProductsModule {}
