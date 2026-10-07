import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Product } from '../../database/entities/product.entity.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ProductDetailDto } from '../../common/dto/product-detail.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import type { AccessTokenPayload } from '../auth/jwt-payload.interface.js';
import { UploadUrlResponseDto } from '../storage/dto/upload-url-response.dto.js';
import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductImageResponseDto } from './dto/product-image-response.dto.js';
import { QueryAdminProductsDto } from './dto/query-admin-products.dto.js';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductsService } from './products.service.js';

// Admin Product Management APIs — Phase-1-API-Specification-v0.1 section 6.
// Every endpoint requires an authenticated Platform User and the matching
// permission (guards applied per-route to match each route's own
// requirement, not a single blanket module-level guard).
@Controller('admin/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('product.view')
  findAll(@Query() query: QueryAdminProductsDto): Promise<PaginatedResponseDto<Product>> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('product.view')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDetailDto> {
    return this.productsService.findOneForAdmin(id);
  }

  @Post()
  @RequirePermissions('product.create')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AccessTokenPayload): Promise<Product> {
    // created_by is always derived from the authenticated user, never a
    // client-supplied value — see API spec section 6.3 and security-rules.md.
    return this.productsService.create(dto, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('product.edit')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<Product> {
    return this.productsService.update(id, dto, user.sub);
  }

  @Post(':id/publish')
  @RequirePermissions('product.publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.publish(id);
  }

  @Post(':id/unpublish')
  @RequirePermissions('product.unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.unpublish(id);
  }

  // See CreateProductImageDto/RequestUploadUrlDto for why this exists as
  // a separate step ahead of POST :id/images.
  @Post(':id/images/upload-url')
  @RequirePermissions('product.edit')
  @HttpCode(HttpStatus.OK)
  requestImageUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    return this.productsService.requestImageUploadUrl(id, dto.filename, dto.contentType);
  }

  @Post(':id/images')
  @RequirePermissions('product.edit')
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    return this.productsService.addImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  @RequirePermissions('product.edit')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<void> {
    return this.productsService.removeImage(id, imageId);
  }
}
