import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SubmitProductDto } from './submit-product.dto.js';

/**
 * Verifies SubmitProductDto.changes actually goes through UpdateProductDto's
 * own whitelist, mirroring main.ts's global ValidationPipe (whitelist:
 * true, transform: true) exactly — plainToInstance + validate is what
 * ValidationPipe does internally.
 *
 * This guards against the gap where `changes` was previously typed as a
 * bare object: a submission could smuggle in fields that aren't on
 * UpdateProductDto (status, organizationId, createdBy, publishedAt) and
 * have them applied verbatim to the product once an Admin approved the
 * edit (products.service.ts's applyApproval() does Object.assign(product,
 * product.pendingChanges) with no filtering of its own).
 */
describe('SubmitProductDto', () => {
  it('keeps fields that are declared on UpdateProductDto', async () => {
    const instance = plainToInstance(SubmitProductDto, {
      changes: { basePrice: 12.5, name: 'Updated name' },
    });

    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });

    expect(errors).toHaveLength(0);
    expect(instance.changes).toBeInstanceOf(Object);
    expect(instance.changes?.basePrice).toBe(12.5);
    expect(instance.changes?.name).toBe('Updated name');
  });

  it('strips fields that are not declared on UpdateProductDto once ValidationPipe-style whitelist runs', async () => {
    // Mirrors what ValidationPipe actually does: plainToInstance() builds
    // the nested UpdateProductDto instance (this is the part @Type() below
    // enables — without it, `changes` stays a plain object and whitelist
    // has nothing to strip); validate({ whitelist: true }) then deletes
    // properties that aren't declared on that nested class.
    const instance = plainToInstance(SubmitProductDto, {
      changes: { basePrice: 12.5, status: 'PUBLISHED', organizationId: 'org-attacker' },
    });

    await validate(instance, { whitelist: true });

    expect((instance.changes as unknown as Record<string, unknown>).status).toBeUndefined();
    expect((instance.changes as unknown as Record<string, unknown>).organizationId).toBeUndefined();
    expect(instance.changes?.basePrice).toBe(12.5);
  });

  it('rejects (forbidNonWhitelisted) a changes object containing fields not on UpdateProductDto', async () => {
    const instance = plainToInstance(SubmitProductDto, {
      changes: { status: 'PUBLISHED', createdBy: 'someone-else' },
    });

    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });

    expect(errors.length).toBeGreaterThan(0);
  });
});
