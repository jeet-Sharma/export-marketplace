import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Category } from '../../database/entities/category.entity.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // GET /categories — section 11, public.
  @ApiOperation({ summary: 'List active categories (section 11)' })
  @Get()
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAllActive();
  }

  // POST /categories — admin-only (category.create), guarded per-route
  // rather than on the whole controller so the public GET above stays
  // unauthenticated.
  @ApiOperation({ summary: 'Create a category' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: Category })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('category.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(dto);
  }
}
