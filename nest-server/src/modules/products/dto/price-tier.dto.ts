import { IsNumber, IsOptional, IsString, Length, Min, ValidateIf } from 'class-validator';

// Mirrors Phase-1-API-Specification-v0.1 section 8 (Price Tier Contract).
// Accepts plain JSON numbers per the API contract's examples; the service
// layer converts to the `numeric` string columns ProductPriceTier expects
// — never round-trip through JS floating point for the persisted value
// itself (see marketplace-domain.md's money-handling rule).
export class PriceTierDto {
  @IsNumber()
  @Min(0.0001, { message: 'minQuantity must be greater than 0' })
  minQuantity!: number;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  maxQuantity?: number | null;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  shippingEstimate?: number | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  dutiesEstimate?: number | null;

  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  taxesEstimate?: number | null;

  @IsString()
  @Length(3, 3)
  currencyCode!: string;
}
