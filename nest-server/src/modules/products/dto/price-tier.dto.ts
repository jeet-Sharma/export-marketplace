import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsNumericPrecision } from '../../../common/validation/is-numeric-precision.decorator.js';

// Matches every numeric column on product_price_tiers — all are
// numeric(18, 4) (see product-price-tier.entity.ts). Same reasoning as
// create-product.dto.ts's PRODUCT_NUMERIC_PRECISION/SCALE; not shared
// across files since the two DTOs' columns are defined independently in
// their respective entities and happen to use the same precision today —
// a future divergence shouldn't require touching both call sites' import.
const PRICE_TIER_NUMERIC_PRECISION = 18;
const PRICE_TIER_NUMERIC_SCALE = 4;

// Mirrors Phase-1-API-Specification-v0.1 section 8 (Price Tier Contract).
// Accepts plain JSON numbers per the API contract's examples; the service
// layer converts to the `numeric` string columns ProductPriceTier expects
// — never round-trip through JS floating point for the persisted value
// itself (see marketplace-domain.md's money-handling rule).
export class PriceTierDto {
  @ApiProperty({
    example: 100,
    description:
      'Minimum quantity for this tier; must be > 0. Up to 4 decimal ' +
      'places, 18 digits total (numeric(18,4)).',
  })
  @IsNumber()
  @Min(0.0001, { message: 'minQuantity must be greater than 0' })
  @IsNumericPrecision(PRICE_TIER_NUMERIC_PRECISION, PRICE_TIER_NUMERIC_SCALE)
  minQuantity!: number;

  @ApiPropertyOptional({
    example: 499,
    nullable: true,
    description:
      'null means open-ended (no upper bound). Up to 4 decimal places, ' +
      '18 digits total (numeric(18,4)).',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @IsNumericPrecision(PRICE_TIER_NUMERIC_PRECISION, PRICE_TIER_NUMERIC_SCALE)
  maxQuantity?: number | null;

  @ApiProperty({
    example: 8.5,
    description:
      'Unit price for this quantity tier. Up to 4 decimal places, 18 ' +
      'digits total (numeric(18,4)).',
  })
  @IsNumber()
  @Min(0)
  @IsNumericPrecision(PRICE_TIER_NUMERIC_PRECISION, PRICE_TIER_NUMERIC_SCALE)
  price!: number;

  @ApiPropertyOptional({ example: 1.2, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  @IsNumericPrecision(PRICE_TIER_NUMERIC_PRECISION, PRICE_TIER_NUMERIC_SCALE)
  shippingEstimate?: number | null;

  @ApiPropertyOptional({ example: 0.8, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  @IsNumericPrecision(PRICE_TIER_NUMERIC_PRECISION, PRICE_TIER_NUMERIC_SCALE)
  dutiesEstimate?: number | null;

  @ApiPropertyOptional({ example: 0.5, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  @IsNumericPrecision(PRICE_TIER_NUMERIC_PRECISION, PRICE_TIER_NUMERIC_SCALE)
  taxesEstimate?: number | null;

  @ApiProperty({
    example: 'USD',
    minLength: 3,
    maxLength: 3,
    description: 'ISO 4217 currency code.',
  })
  @IsString()
  @Length(3, 3)
  currencyCode!: string;
}
