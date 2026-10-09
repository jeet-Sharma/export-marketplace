import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProductDto } from './update-product.dto.js';

// Qodo review finding: PartialType(CreateProductDto) wraps every field in
// @IsOptional(), which treats BOTH omitted (undefined) and explicit `null`
// as "valid, skip further checks" — so `{"name": null}` or
// `{"vendorId": null}` previously passed DTO validation and would reach
// the DB as a NOT NULL violation. These tests prove the @ValidateIf-based
// fix in update-product.dto.ts actually rejects explicit null for the two
// required fields while still allowing them to be omitted.
describe('UpdateProductDto', () => {
  it('allows name and vendorId to be omitted entirely', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      description: 'Updated description only',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an explicit null for name', async () => {
    const dto = plainToInstance(UpdateProductDto, { name: null });

    const errors = await validate(dto);

    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });

  it('rejects an explicit null for vendorId', async () => {
    const dto = plainToInstance(UpdateProductDto, { vendorId: null });

    const errors = await validate(dto);

    const vendorIdError = errors.find((e) => e.property === 'vendorId');
    expect(vendorIdError).toBeDefined();
  });

  it('accepts a valid, non-null name and vendorId', async () => {
    const dto = plainToInstance(UpdateProductDto, {
      name: 'Updated Name',
      vendorId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty string for name (still enforced via MinLength/Length)', async () => {
    const dto = plainToInstance(UpdateProductDto, { name: '' });

    const errors = await validate(dto);

    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });
});
