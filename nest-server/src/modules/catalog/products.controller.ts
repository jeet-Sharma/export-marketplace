import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { SubmitProductDto } from './dto/submit-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';
import type { AuthenticatedRequest } from '../../common/types/request-context.type.js';

/**
 * REST surface for `product` (Part 3.1). Every route is scoped by
 * req.user.organizationId — read routes filter by it, write routes verify
 * the row belongs to it before touching anything (both enforced inside
 * ProductsService, not duplicated here).
 *
 * req.user is expected to already exist on the request by the time these
 * handlers run — populated by the auth layer owned by another developer
 * (not implemented in this module). No guard is applied here; once that
 * auth guard is registered app-wide or on this controller, these handlers
 * do not need to change.
 *
 * ValidationPipe is applied locally via @UsePipes rather than globally in
 * main.ts, per this module's scope — see create-product.dto.ts etc. for
 * the validated shape of each body.
 */
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('catalog/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.productsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.findOne(id, req.user.organizationId);
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.create(dto, req.user.organizationId, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.update(id, dto, req.user.organizationId);
  }

  /** Maker submits a DRAFT/REJECTED product, or a live-edit change set, for review. */
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.submit(id, dto, req.user.organizationId, req.user.userId);
  }

  /** Checker or Admin approves/rejects, resolved by the product's current pending stage. */
  @Post(':id/review')
  review(@Param('id') id: string, @Body() dto: ReviewProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.review(id, dto, req.user.organizationId, req.user.userId);
  }

  /** APPROVED -> PUBLISHED. */
  @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.publish(id, req.user.organizationId);
  }

  /** PUBLISHED -> DELISTED. */
  @Post(':id/delist')
  delist(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.delist(id, req.user.organizationId);
  }
}
