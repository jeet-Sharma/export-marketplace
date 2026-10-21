import { IsBoolean, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

/**
 * Body for PUT /catalog/products/:productId/target-countries/:countryCode
 * (Part 3.2). block_reason is required when is_allowed is false — mirrors
 * the migration's CHECK (is_allowed OR coalesce(btrim(block_reason), '') <> '').
 */
export class UpsertTargetCountryDto {
  @IsOptional()
  @IsString()
  nationalTariffCode?: string;

  @IsBoolean()
  isAllowed!: boolean;

  @ValidateIf((dto: UpsertTargetCountryDto) => dto.isAllowed === false)
  @IsString()
  @MinLength(1)
  blockReason?: string;
}
