import { Body, Controller, Delete, Get, Param, Put, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductTargetCountriesService } from './product-target-countries.service.js';
import { UpsertTargetCountryDto } from './dto/upsert-target-country.dto.js';
import { requireOrganizationId, type AuthenticatedRequest } from '../../common/types/request-context.type.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

/** REST surface for product_target_country (Part 3.2), nested under its parent product. */
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('catalog/products/:productId/target-countries')
export class ProductTargetCountriesController {
  constructor(private readonly targetCountriesService: ProductTargetCountriesService) {}

  @Get()
  findAll(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.targetCountriesService.findAllForProduct(productId, requireOrganizationId(req.user));
  }

  @Put(':countryCode')
  upsert(
    @Param('productId') productId: string,
    @Param('countryCode') countryCode: string,
    @Body() dto: UpsertTargetCountryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.targetCountriesService.upsert(productId, countryCode, dto, requireOrganizationId(req.user));
  }

  @Delete(':countryCode')
  remove(
    @Param('productId') productId: string,
    @Param('countryCode') countryCode: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.targetCountriesService.remove(productId, countryCode, requireOrganizationId(req.user));
  }
}
