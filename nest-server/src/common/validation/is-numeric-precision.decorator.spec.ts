import { IsNumber } from 'class-validator';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  IsNumericPrecision,
  isWithinNumericPrecision,
} from './is-numeric-precision.decorator.js';

// Qodo review Bug #10: Product.price/moq and every ProductPriceTier
// numeric column are numeric(18, 4) in Postgres — these tests prove the
// decorator actually rejects values that would otherwise be silently
// rounded (too many decimal places) or raise a raw DB overflow error (too
// many total digits) when such a value reaches the database.
class TestDto {
  @IsNumber()
  @IsNumericPrecision(18, 4)
  value!: number;
}

describe('isWithinNumericPrecision (pure function)', () => {
  it('accepts a value within precision and scale', () => {
    expect(isWithinNumericPrecision(1234.5678, 18, 4)).toBe(true);
  });

  it('accepts an integer with no decimal part', () => {
    expect(isWithinNumericPrecision(100, 18, 4)).toBe(true);
  });

  it('accepts a value with fewer decimal places than scale', () => {
    expect(isWithinNumericPrecision(8.5, 18, 4)).toBe(true);
  });

  it('rejects a value with more decimal places than scale', () => {
    expect(isWithinNumericPrecision(10.12345, 18, 4)).toBe(false);
  });

  it('rejects a value whose total digit count exceeds precision', () => {
    // Uses a smaller precision (10, not 18) deliberately: JS doubles only
    // reliably hold ~15-17 significant decimal digits, so a value with
    // enough digits to exceed numeric(18,4)'s 18-digit precision (e.g. 15
    // integer + 4 decimal = 19 digits) gets silently rounded by the
    // double representation itself before this function ever sees it —
    // that's a real, separate limitation of using JS `number` for
    // numeric(18,4) values at all (see this file's module comment), not
    // something a test at the 18-digit boundary could isolate. A smaller
    // precision keeps the test's input safely within double's exact
    // range so it's actually testing the precision-counting logic, not
    // floating-point rounding.
    // 10 integer digits + 2 decimal digits = 12 total, 2 over precision=10,
    // while staying within scale=2 — isolates the precision check from
    // the scale check.
    expect(isWithinNumericPrecision(1234567890.12, 10, 2)).toBe(false);
  });

  it('accepts a value at exactly the precision/scale boundary', () => {
    // 14 integer digits + 4 decimal digits = 18, exactly at the limit.
    expect(isWithinNumericPrecision(12345678901234.1234, 18, 4)).toBe(true);
  });

  it('does not count a leading zero before the decimal point as a significant digit', () => {
    expect(isWithinNumericPrecision(0.1234, 18, 4)).toBe(true);
  });

  it('handles negative values the same as their absolute value', () => {
    expect(isWithinNumericPrecision(-10.12345, 18, 4)).toBe(false);
    expect(isWithinNumericPrecision(-1234.5678, 18, 4)).toBe(true);
  });
});

describe('IsNumericPrecision decorator (integration with class-validator)', () => {
  it('passes validation for a value within precision and scale', async () => {
    const dto = plainToInstance(TestDto, { value: 1234.5678 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails validation for a value with too many decimal places', async () => {
    const dto = plainToInstance(TestDto, { value: 10.123456 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNumericPrecision');
  });

  it('fails validation for a value with too many total digits', async () => {
    // See isWithinNumericPrecision's "too many total digits" test comment
    // for why this uses a smaller precision (18 is TestDto's declared
    // precision; this still correctly exercises the same code path since
    // precision/scale are decorator parameters, not hardcoded).
    class SmallerPrecisionDto {
      @IsNumber()
      @IsNumericPrecision(10, 2)
      value!: number;
    }
    const dto = plainToInstance(SmallerPrecisionDto, { value: 1234567890.12 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNumericPrecision');
  });

  it('produces a message naming the field, max decimals, and max integer digits', async () => {
    const dto = plainToInstance(TestDto, { value: 10.123456 });
    const errors = await validate(dto);
    const message = errors[0].constraints?.isNumericPrecision;
    expect(message).toContain('value');
    expect(message).toContain('4 decimal place');
    expect(message).toContain('14 digit');
  });

  it('does not duplicate the IsNumber failure for a non-numeric value', async () => {
    const dto = plainToInstance(TestDto, { value: 'not-a-number' });
    const errors = await validate(dto);
    // Only @IsNumber's error should fire — isWithinNumericPrecision treats
    // non-numbers as "not my concern" and returns true (valid) so this
    // decorator doesn't produce a second, redundant error message.
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isNumber');
    expect(errors[0].constraints).not.toHaveProperty('isNumericPrecision');
  });
});
