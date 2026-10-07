import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PriceTierDto } from './price-tier.dto.js';

// Mirrors Phase-1-API-Specification-v0.1 section 7 (Product Payload).
// Fields marked TBD in the source Data Model/API spec (description,
// categoryId, price, currencyCode, unit, moq, hsCode, sourceCountryId,
// exportEligibility) are optional here, matching their nullable columns —
// publish-time mandatory-field enforcement happens in the service layer
// (see ProductsService.assertPublishable), not via DTO decorators, since
// the exact mandatory set is still an open decision per the spec's section 18.
export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @Length(1, 250)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsUUID()
  vendorId!: string;

  @IsIn(['DRAFT', 'PUBLISHED'])
  status!: 'DRAFT' | 'PUBLISHED';

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001, { message: 'moq must be greater than 0' })
  moq?: number;

  @IsOptional()
  @IsString()
  hsCode?: string;

  @IsOptional()
  @IsUUID()
  sourceCountryId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  targetCountryIds?: string[];

  @IsOptional()
  @IsString()
  exportEligibility?: string;

  @IsOptional()
  @IsString()
  countryRestrictions?: string;

  @IsOptional()
  @IsString()
  estimatedDeliveryText?: string;

  @IsOptional()
  @IsString()
  dutiesTaxesNote?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTierDto)
  priceTiers?: PriceTierDto[];
}
