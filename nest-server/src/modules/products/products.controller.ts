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
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Product } from '../../database/entities/product.entity.js';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto.js';
import { ProductDetailDto } from '../../common/dto/product-detail.dto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import type { AccessTokenPayload } from '../auth/jwt-payload.interface.js';
import { CreateProductImageDto } from './dto/create-product-image.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductImageResponseDto } from './dto/product-image-response.dto.js';
import { QueryAdminProductsDto } from './dto/query-admin-products.dto.js';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { UploadUrlResponseDto } from './dto/upload-url-response.dto.js';
import { ProductsService } from './products.service.js';

// Admin Product Management APIs — Phase-1-API-Specification-v0.1 section 6.
// Every endpoint requires an authenticated Platform User and the matching
// permission (guards applied per-route to match each route's own
// requirement, not a single blanket module-level guard).
//
// Response types for Product/ProductDetailDto/PaginatedResponseDto are
// documented via @ApiOkResponse's inline `description` rather than
// `type:` — Product is a TypeORM entity and PaginatedResponseDto/
// ProductDetailDto are generic interfaces, neither of which carry
// @ApiProperty metadata Swagger can introspect without a much larger
// refactor (annotating the entity itself). The request DTOs below are
// fully typed and are what matters most for a client integrating against
// this API.
@ApiTags('Admin Products')
@ApiBearerAuth('access-token')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'List drafts and published products (section 6.1)' })
  @ApiOkResponse({
    description: 'Paginated { items, pagination } envelope of Product rows.',
  })
  @Get()
  @RequirePermissions('product.view')
  findAll(
    @Query() query: QueryAdminProductsDto,
  ): Promise<PaginatedResponseDto<Product>> {
    return this.productsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get one product for management (section 6.2)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({
    description:
      'Full product record including images, price tiers, and target countries.',
  })
  @Get(':id')
  @RequirePermissions('product.view')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductDetailDto> {
    return this.productsService.findOneForAdmin(id);
  }

  @ApiOperation({
    summary: 'Create a product (section 6.3)',
    description: 'May be saved as DRAFT or request immediate PUBLISHED status.',
  })
  @ApiOkResponse({ description: 'The created product.' })
  @Post()
  @RequirePermissions('product.create')
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<Product> {
    // created_by is always derived from the authenticated user, never a
    // client-supplied value — see API spec section 6.3 and security-rules.md.
    return this.productsService.create(dto, user.sub);
  }

  @ApiOperation({ summary: 'Partially update a product (section 6.4)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The updated product.' })
  @Patch(':id')
  @RequirePermissions('product.edit')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<Product> {
    return this.productsService.update(id, dto, user.sub);
  }

  @ApiOperation({ summary: 'Publish a draft product (section 6.5)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The now-PUBLISHED product.' })
  @Post(':id/publish')
  @RequirePermissions('product.publish')
  @HttpCode(HttpStatus.OK)
  publish(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.publish(id);
  }

  @ApiOperation({
    summary: 'Return a published product to DRAFT (section 6.6)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'The now-DRAFT product.' })
  @Post(':id/unpublish')
  @RequirePermissions('product.unpublish')
  @HttpCode(HttpStatus.OK)
  unpublish(@Param('id', ParseUUIDPipe) id: string): Promise<Product> {
    return this.productsService.unpublish(id);
  }

  // See CreateProductImageDto/RequestUploadUrlDto for why this exists as
  // a separate step ahead of POST :id/images.
  @ApiOperation({
    summary: 'Request a presigned S3 upload URL for a new product image',
    description:
      'Not a literally named endpoint in API spec section 4 — section 9 explicitly leaves the ' +
      'direct-multipart-vs-presigned-S3 choice open; this is the presigned-URL half of that flow.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: UploadUrlResponseDto })
  @Post(':id/images/upload-url')
  @RequirePermissions('product.edit')
  @HttpCode(HttpStatus.OK)
  requestImageUploadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestUploadUrlDto,
  ): Promise<UploadUrlResponseDto> {
    return this.productsService.requestImageUploadUrl(
      id,
      dto.filename,
      dto.contentType,
    );
  }

  @ApiOperation({
    summary: 'Add product image metadata after uploading to S3 (section 9.1)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductImageResponseDto })
  @Post(':id/images')
  @RequirePermissions('product.edit')
  addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductImageDto,
  ): Promise<ProductImageResponseDto> {
    return this.productsService.addImage(id, dto);
  }

  @ApiOperation({ summary: 'Remove a product image (section 9.2)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiParam({ name: 'imageId', format: 'uuid' })
  @ApiNoContentResponse()
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
