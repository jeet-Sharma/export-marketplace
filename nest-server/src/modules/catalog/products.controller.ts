import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { SubmitProductDto } from './dto/submit-product.dto.js';
import { ReviewProductDto } from './dto/review-product.dto.js';
import { requireOrganizationId, type AuthenticatedRequest } from '../../common/types/request-context.type.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

/**
 * REST surface for `product` (Part 3.1). Every route is scoped by
 * req.user.organizationId — read routes filter by it, write routes verify
 * the row belongs to it before touching anything (both enforced inside
 * ProductsService, not duplicated here).
 *
 * JwtAuthGuard populates req.user for every route on this controller —
 * ProductsService's role/permission checks (review()) and the
 * organizationId scoping above depend on it actually being a verified
 * principal, not the unenforced contract this module previously assumed.
 *
 * ValidationPipe is applied locally via @UsePipes rather than globally in
 * main.ts, per this module's scope — see create-product.dto.ts etc. for
 * the validated shape of each body.
 */
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('catalog/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.productsService.findAll(requireOrganizationId(req.user));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.findOne(id, requireOrganizationId(req.user));
  }

  @Post()
  create(@Body() dto: CreateProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.create(dto, requireOrganizationId(req.user), req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.update(id, dto, requireOrganizationId(req.user));
  }

  /** Maker submits a DRAFT/REJECTED product, or a live-edit change set, for review. */
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.submit(id, dto, requireOrganizationId(req.user), req.user.userId);
  }

  /** Checker or Admin approves/rejects, resolved by the product's current pending stage. */
  @Post(':id/review')
  review(@Param('id') id: string, @Body() dto: ReviewProductDto, @Req() req: AuthenticatedRequest) {
    return this.productsService.review(
      id,
      dto,
      req.user.userType,
      requireOrganizationId(req.user),
      req.user.userId,
      req.user.roles,
    );
  }

  /** APPROVED -> PUBLISHED. */
  @Post(':id/publish')
  publish(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.publish(id, requireOrganizationId(req.user));
  }

  /** PUBLISHED -> DELISTED. */
  @Post(':id/delist')
  delist(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.productsService.delist(id, requireOrganizationId(req.user));
  }
}
