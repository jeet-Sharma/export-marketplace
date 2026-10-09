import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';
import { PriceTierDto } from './price-tier.dto.js';

// Qodo review Bug #10: proves the numeric(18,4) precision/scale check is
// actually wired onto the real DTOs used by POST /admin/products, not just
// the standalone decorator unit tests.
function baseProduct(overrides: Partial<CreateProductDto> = {}) {
  return plainToInstance(CreateProductDto, {
    name: 'Test Product',
    vendorId: '550e8400-e29b-41d4-a716-446655440000',
    status: 'DRAFT',
    ...overrides,
  });
}

describe('CreateProductDto numeric precision (Bug #10)', () => {
  it('accepts a price within numeric(18,4)', async () => {
    const dto = baseProduct({ price: 1234.5678 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a price with more than 4 decimal places', async () => {
    const dto = baseProduct({ price: 10.123456 });
    const errors = await validate(dto);
    const priceError = errors.find((e) => e.property === 'price');
    expect(priceError).toBeDefined();
    expect(priceError?.constraints).toHaveProperty('isNumericPrecision');
  });

  it('rejects a moq with more than 4 decimal places', async () => {
    const dto = baseProduct({ moq: 100.123456 });
    const errors = await validate(dto);
    const moqError = errors.find((e) => e.property === 'moq');
    expect(moqError).toBeDefined();
    expect(moqError?.constraints).toHaveProperty('isNumericPrecision');
  });
});

describe('PriceTierDto numeric precision (Bug #10)', () => {
  function baseTier(overrides: Partial<PriceTierDto> = {}) {
    return plainToInstance(PriceTierDto, {
      minQuantity: 100,
      price: 8.5,
      currencyCode: 'USD',
      ...overrides,
    });
  }

  it('accepts values within numeric(18,4)', async () => {
    const dto = baseTier({ price: 8.5, shippingEstimate: 1.2345 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a price with more than 4 decimal places', async () => {
    const dto = baseTier({ price: 8.123456 });
    const errors = await validate(dto);
    const priceError = errors.find((e) => e.property === 'price');
    expect(priceError).toBeDefined();
    expect(priceError?.constraints).toHaveProperty('isNumericPrecision');
  });

  it('rejects a shippingEstimate with more than 4 decimal places', async () => {
    const dto = baseTier({ shippingEstimate: 1.123456 });
    const errors = await validate(dto);
    const error = errors.find((e) => e.property === 'shippingEstimate');
    expect(error).toBeDefined();
    expect(error?.constraints).toHaveProperty('isNumericPrecision');
  });

  it('still accepts a null shippingEstimate (optional/nullable field)', async () => {
    const dto = baseTier({ shippingEstimate: null });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
