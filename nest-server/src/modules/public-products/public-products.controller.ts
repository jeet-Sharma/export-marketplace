import { Controller, Get, Param, Query } from '@nestjs/common';
import { Product } from '../../database/entities/product.entity.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ProductDetailDto } from '../../common/dto/product-detail.dto.js';
import { QueryPublicProductsDto } from './dto/query-public-products.dto.js';
import { PublicProductsService } from './public-products.service.js';

// Public marketplace catalogue — section 12. No auth guard: these are
// the only endpoints in Phase 1 meant to be reachable without a Platform
// User session.
@Controller('products')
export class PublicProductsController {
  constructor(private readonly publicProductsService: PublicProductsService) {}

  @Get()
  findAll(@Query() query: QueryPublicProductsDto): Promise<PaginatedResponseDto<Product>> {
    return this.publicProductsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<ProductDetailDto> {
    return this.publicProductsService.findOneBySlug(slug);
  }
}
