import { Controller, Get } from '@nestjs/common';
import { Category } from '../../database/entities/category.entity.js';
import { CategoriesService } from './categories.service.js';

// GET /categories — section 11, public.
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAllActive();
  }
}
