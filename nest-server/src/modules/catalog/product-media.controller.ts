import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductMediaService } from './product-media.service.js';
import { CreateProductMediaDto } from './dto/create-product-media.dto.js';
import { requireOrganizationId, type AuthenticatedRequest } from '../../common/types/request-context.type.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

/**
 * REST surface for product_media (Part 3.4), nested under its parent
 * product. Only records metadata for a file already uploaded through the
 * existing StorageModule — this controller does not accept file bytes.
 */
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('catalog/products/:productId/media')
export class ProductMediaController {
  constructor(private readonly mediaService: ProductMediaService) {}

  @Get()
  findAll(@Param('productId') productId: string, @Req() req: AuthenticatedRequest) {
    return this.mediaService.findAllForProduct(productId, requireOrganizationId(req.user));
  }

  @Post()
  create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductMediaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mediaService.create(productId, dto, requireOrganizationId(req.user));
  }

  @Delete(':mediaId')
  remove(
    @Param('productId') productId: string,
    @Param('mediaId') mediaId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.mediaService.remove(productId, mediaId, requireOrganizationId(req.user));
  }
}
