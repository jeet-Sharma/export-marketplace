import { Body, Controller, Delete, Get, Param, Put, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductTargetCountriesService } from './product-target-countries.service.js';
import { UpsertTargetCountryDto } from './dto/upsert-target-country.dto.js';
import type { AuthenticatedRequest } from '../../common/types/request-context.type.js';

/** REST surface for product_target_country (Part 3.2), nested under its parent product. */
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('catalog/products/:productId/target-countries')
export class ProductTargetCountriesController {
  constructor(private readonly targetCountriesService: ProductTargetCountriesService) {}

  @Get()
  findAll(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.targetCountriesService.findAllForProduct(productId, req.user.organizationId);
  }

  @Put(':countryCode')
  upsert(
    @Param('productId') productId: string,
    @Param('countryCode') countryCode: string,
    @Body() dto: UpsertTargetCountryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.targetCountriesService.upsert(productId, countryCode, dto, req.user.organizationId);
  }

  @Delete(':countryCode')
  remove(
    @Param('productId') productId: string,
    @Param('countryCode') countryCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.targetCountriesService.remove(productId, countryCode, req.user.organizationId);
  }
}
