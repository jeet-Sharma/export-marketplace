import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity.js';
import type { CreateCategoryDto } from './dto/create-category.dto.js';

@Injectable()
export class CategoriesService {
  // Bounded retry count for the slug-uniqueness race below — see create()'s
  // comment. Mirrors ProductsService.MAX_SLUG_RETRIES's reasoning/value.
  private static readonly MAX_SLUG_RETRIES = 5;

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
  // kebab-case approach as ProductsService.generateUniqueSlug), de-
  // duplicated with a numeric suffix on collision.
  //
  // generateUniqueSlug's existence check runs BEFORE the insert, so it is
  // only a best-effort first pass: two concurrent create() calls for the
  // same category name can both pass that check before either commits,
  // then both attempt to insert the same slug. Previously, whichever lost
  // that race hit UQ_categories_slug and the raw QueryFailedError (SQLSTATE
  // 23505) reached the client as an unhandled 500 — this retries with a
  // freshly generated candidate instead, the same bounded-retry pattern
  // ProductsService.create() already uses for its own slug race. If every
  // retry still loses (MAX_SLUG_RETRIES exhausted), a clean 409 is
  // returned rather than ever letting a raw DB error reach the client.
  async create(dto: CreateCategoryDto): Promise<Category> {
    for (
      let attempt = 1;
      attempt <= CategoriesService.MAX_SLUG_RETRIES;
      attempt++
    ) {
      const slug = await this.generateUniqueSlug(
        dto.name,
        attempt > 1 ? attempt : undefined,
      );
      const category = this.categoryRepository.create({
        name: dto.name,
        slug,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? null,
      });

      try {
        return await this.categoryRepository.save(category);
      } catch (error) {
        if (
          this.isUniqueViolation(error) &&
          attempt < CategoriesService.MAX_SLUG_RETRIES
        ) {
          continue;
        }
        if (this.isUniqueViolation(error)) {
          throw new ConflictException({
            code: 'CONFLICT',
            message:
              'Could not allocate a unique category slug, please try again',
            errors: [
              {
                field: 'name',
                message: 'A category with a conflicting slug already exists',
              },
            ],
          });
        }
        throw error;
      }
    }

    // Unreachable — the loop above always returns or throws — but
    // satisfies the compiler's control-flow analysis. Same pattern as
    // ProductsService.create()'s equivalent fallback.
    throw new ConflictException('Could not allocate a unique category slug');
  }

  // Same SQLSTATE 23505 check as ProductsService.isUniqueViolation —
  // see that method's comment. Not shared/extracted into a common
  // utility; both services independently check the same TypeORM/pg error
  // shape, matching how getForeignKeyViolationField/CONSTRAINT_FIELD_MAP
  // are likewise per-service today (no shared DB-error-mapping utility
  // exists yet in src/common/).
  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = (
      error as QueryFailedError & {
        driverError?: { code?: string; constraint?: string };
      }
    ).driverError;
    const code = driverError?.code ?? (error as { code?: string }).code;
    return code === '23505';
  }

  // Best-effort uniqueness check — see create()'s comment above.
  // `retryAttempt`, when provided, salts the starting suffix so a retry
  // after a lost race doesn't recompute the exact same candidate that
  // just lost — same approach as ProductsService.generateUniqueSlug.
  private async generateUniqueSlug(
    name: string,
    retryAttempt?: number,
  ): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 170);

    const baseOrFallback = base || 'category';
    let suffix = retryAttempt
      ? retryAttempt * 1000 + Math.floor(Math.random() * 1000)
      : 1;
    let candidate =
      suffix === 1 ? baseOrFallback : `${baseOrFallback}-${suffix}`;

    while (
      await this.categoryRepository.exists({ where: { slug: candidate } })
    ) {
      suffix += 1;
      candidate = `${baseOrFallback}-${suffix}`;
    }
    return candidate;
  }
}
