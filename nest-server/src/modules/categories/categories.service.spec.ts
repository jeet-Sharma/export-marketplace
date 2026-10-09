import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CategoriesService } from './categories.service.js';

// Qodo review finding: two concurrent create() calls for the same
// category name can both pass generateUniqueSlug's pre-check before
// either commits, then race on the same slug at insert time. Previously
// the loser's raw QueryFailedError (SQLSTATE 23505) reached the client as
// an unhandled 500. These tests verify the bounded-retry fix: a lost race
// is retried with a fresh slug candidate, and only reports a clean 409 if
// every retry is also lost.
describe('CategoriesService.create', () => {
  function makeUniqueViolation(): QueryFailedError {
    const error = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      {
        driverError: { code: '23505', constraint: 'UQ_categories_slug' },
      },
    );
    Object.setPrototypeOf(error, QueryFailedError.prototype);
    return error as unknown as QueryFailedError;
  }

  function createService() {
    const categoryRepository = {
      exists: vi.fn().mockResolvedValue(false),
      create: vi.fn().mockImplementation((value) => value),
      save: vi.fn(),
    };
    const service = new CategoriesService(categoryRepository as never);
    return { service, categoryRepository };
  }

  it('creates the category on the first attempt when there is no race', async () => {
    const { service, categoryRepository } = createService();
    categoryRepository.save.mockResolvedValue({
      id: 'c1',
      name: 'Spices',
      slug: 'spices',
      description: null,
      isActive: true,
      sortOrder: null,
    });

    const result = await service.create({ name: 'Spices' });

    expect(result.slug).toBe('spices');
    expect(categoryRepository.save).toHaveBeenCalledTimes(1);
  });

  it('retries with a new slug candidate after losing a unique-violation race, then succeeds', async () => {
    const { service, categoryRepository } = createService();
    categoryRepository.save
      .mockRejectedValueOnce(makeUniqueViolation())
      .mockResolvedValueOnce({
        id: 'c1',
        name: 'Spices',
        slug: 'spices-retry',
        description: null,
        isActive: true,
        sortOrder: null,
      });

    const result = await service.create({ name: 'Spices' });

    expect(categoryRepository.save).toHaveBeenCalledTimes(2);
    expect(result.id).toBe('c1');
  });

  it('returns a clean 409 ConflictException (not a raw 500) when every retry loses the race', async () => {
    const { service, categoryRepository } = createService();
    categoryRepository.save.mockRejectedValue(makeUniqueViolation());

    await expect(service.create({ name: 'Spices' })).rejects.toThrow(
      ConflictException,
    );
    // MAX_SLUG_RETRIES = 5 — never retries forever.
    expect(categoryRepository.save).toHaveBeenCalledTimes(5);
  });

  it('propagates a non-unique-violation error unchanged', async () => {
    const { service, categoryRepository } = createService();
    const unrelatedError = new Error('connection reset');
    categoryRepository.save.mockRejectedValue(unrelatedError);

    await expect(service.create({ name: 'Spices' })).rejects.toBe(
      unrelatedError,
    );
    expect(categoryRepository.save).toHaveBeenCalledTimes(1);
  });
});
