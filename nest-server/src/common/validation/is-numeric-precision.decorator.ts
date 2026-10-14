import {
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
} from 'class-validator';

/**
 * Validates that a number fits within a Postgres `numeric(precision, scale)`
 * column — the exact column type every monetary/quantity field in this
 * project uses (see product.entity.ts, product-price-tier.entity.ts).
 * `precision` is the total number of significant digits allowed (both
 * sides of the decimal point combined); `scale` is how many of those must
 * fall after the decimal point.
 *
 * Qodo review Bug #10: without this, a client-supplied value with more
 * decimal places than the column's scale (e.g. 10.123456 against
 * numeric(18,4)) is silently rounded by Postgres on insert — the stored
 * value differs from what the client sent with no indication anything
 * happened. A value with too many total digits (e.g. a 15-digit integer
 * part against numeric(18,4), leaving no room for scale) raises a raw
 * "numeric field overflow" database error, which reaches the client as an
 * opaque 500 instead of a clean 400. This decorator catches both cases at
 * the API boundary, before either reaches the database.
 *
 * Deliberately NOT using class-validator's built-in
 * `@IsNumber({ maxDecimalPlaces })`: that option has a well-known bug
 * (typestack/class-validator#1627) where it silently fails to validate for
 * at least some decimal inputs, and it has no equivalent for total
 * precision (digit count) at all — only decimal-place count. This
 * decorator checks both in one pass using the value's string
 * representation, which avoids floating-point representation quirks
 * decimal-place counting via arithmetic (e.g. `value * 10**n`) can hit.
 *
 * KNOWN LIMITATION: a JS `number` (IEEE 754 double) only reliably holds
 * ~15-17 significant decimal digits — a client-sent value with the full
 * 18 digits numeric(18,4) nominally allows (e.g. 15 integer + 4 decimal
 * digits) may already have been silently rounded by JSON.parse before
 * this decorator ever runs, independent of this check's own correctness.
 * This is a pre-existing constraint of representing numeric(18,4) values
 * as `number` in the DTO layer (see price-tier.dto.ts's money-handling
 * comment) rather than something this decorator introduces or can fully
 * close — closing it completely would require accepting price/quantity
 * fields as strings instead of JSON numbers, which is a larger API
 * contract change out of scope for this fix. In practice this only
 * matters for values near the extreme end of numeric(18,4)'s range (e.g.
 * prices in the hundreds of trillions), which aren't realistic inputs for
 * this project's product pricing/quantity fields.
 */
export function IsNumericPrecision(
  precision: number,
  scale: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNumericPrecision',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [precision, scale],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== 'number' || !Number.isFinite(value)) {
            // Not this decorator's concern — @IsNumber (always paired with
            // this one) already reports the right error for a non-number.
            return true;
          }
          const [maxPrecision, maxScale] = args.constraints as [
            number,
            number,
          ];
          return isWithinNumericPrecision(value, maxPrecision, maxScale);
        },
        defaultMessage(args: ValidationArguments): string {
          const [maxPrecision, maxScale] = args.constraints as [
            number,
            number,
          ];
          const maxIntegerDigits = maxPrecision - maxScale;
          return (
            `${args.property} must have at most ${maxScale} decimal place(s) ` +
            `and at most ${maxIntegerDigits} digit(s) before the decimal point ` +
            `(numeric(${maxPrecision}, ${maxScale}))`
          );
        },
      },
    });
  };
}

/**
 * Exported standalone so it can be unit-tested directly and reused outside
 * the decorator (e.g. if a service ever needs the same check server-side
 * on a value that didn't come through DTO validation).
 */
export function isWithinNumericPrecision(
  value: number,
  precision: number,
  scale: number,
): boolean {
  // Stringify via toFixed(scale + 1) first would itself round — instead
  // use the value's own decimal representation (no exponential notation
  // for the magnitudes this project's columns realistically hold) so the
  // check reflects exactly what the client sent, not a rounded copy of it.
  const asString = Math.abs(value).toString();
  if (asString.includes('e') || asString.includes('E')) {
    // Exponential notation only appears for extremely large/small
    // magnitudes that are already far outside any numeric(18,4)-class
    // column this project uses — treat as a precision failure rather
    // than attempting to expand it.
    return false;
  }

  const [integerPart, decimalPart = ''] = asString.split('.');
  // "0" as the integer part of e.g. 0.5 shouldn't count as a significant
  // digit toward precision — Postgres's numeric precision counts
  // significant digits, and a leading zero before the decimal point on a
  // sub-1 value isn't one.
  const integerDigits = integerPart === '0' ? 0 : integerPart.length;
  const decimalDigits = decimalPart.length;

  if (decimalDigits > scale) {
    return false;
  }
  if (integerDigits + decimalDigits > precision) {
    return false;
  }
  return true;
}
