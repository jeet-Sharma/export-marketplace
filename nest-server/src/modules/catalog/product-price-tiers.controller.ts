import { Body, Controller, Delete, Get, Param, Post, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductPriceTiersService } from './product-price-tiers.service.js';
import { CreatePriceTierDto } from './dto/create-price-tier.dto.js';
import type { AuthenticatedRequest } from '../../common/types/request-context.type.js';

/** REST surface for product_price_tier (Part 3.3), nested under its parent product. */
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('catalog/products/:productId/price-tiers')
export class ProductPriceTiersController {
  constructor(private readonly priceTiersService: ProductPriceTiersService) {}

  @Get()
  findAll(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.priceTiersService.findAllForProduct(productId, req.user.organizationId);
  }

  @Post()
  create(
    @Param('productId') productId: string,
    @Body() dto: CreatePriceTierDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.priceTiersService.create(productId, dto, req.user.organizationId);
  }

  @Delete(':tierId')
  remove(
    @Param('productId') productId: string,
    @Param('tierId') tierId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.priceTiersService.remove(productId, tierId, req.user.organizationId);
  }
}
