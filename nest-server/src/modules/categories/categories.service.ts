import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  // GET /categories (section 11) — public, active categories only for
  // filters/forms.
  findAllActive(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  // POST /admin/categories. Supplies the categoryId CreateProductDto
  // accepts — without a category to reference, products.category_id can
  // only ever be left null. slug is derived from name here (same
  // kebab-case approach as ProductsService.generateUniqueSlug) rather
  // than client-supplied, and de-duplicated with a numeric suffix on
  // collision so this never 500s on a duplicate name the way a bare
  // UQ_categories_slug violation would.
  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = await this.generateUniqueSlug(dto.name);
    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? null,
    });
    return this.categoryRepository.save(category);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 170);

    const baseOrFallback = base || 'category';
    let suffix = 1;
    let candidate = baseOrFallback;

    while (
      await this.categoryRepository.exists({ where: { slug: candidate } })
    ) {
      suffix += 1;
      candidate = `${baseOrFallback}-${suffix}`;
    }
    return candidate;
  }
}
