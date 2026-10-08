import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Organic Turmeric Powder', maxLength: 250 })
  @IsString()
  @MinLength(1)
  @Length(1, 250)
  name!: string;

  @ApiPropertyOptional({
    example: 'Export-grade turmeric powder.',
    description: 'TBD publish requirement.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'TBD publish requirement; one category per product in v0.1.',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ format: 'uuid', description: 'Selected supplier/vendor.' })
  @IsUUID()
  vendorId!: string;

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED'] })
  @IsIn(['DRAFT', 'PUBLISHED'])
  status!: 'DRAFT' | 'PUBLISHED';

  @ApiPropertyOptional({
    example: 8.5,
    description: 'Base product price. TBD publish requirement.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 'USD',
    minLength: 3,
    maxLength: 3,
    description: 'ISO 4217 currency code.',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @ApiPropertyOptional({
    example: 'kg',
    description: 'Commercial unit, e.g. kg, piece, box.',
  })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Minimum Order Quantity. TBD publish requirement.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.0001, { message: 'moq must be greater than 0' })
  moq?: number;

  @ApiPropertyOptional({
    example: '0910.30',
    description: 'Harmonized System code. TBD publish requirement.',
  })
  @IsOptional()
  @IsString()
  hsCode?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Source/origin country.',
  })
  @IsOptional()
  @IsUUID()
  sourceCountryId?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Available/target market country IDs.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  targetCountryIds?: string[];

  @ApiPropertyOptional({
    example: 'ELIGIBLE',
    description: 'Informational; vocabulary TBD.',
  })
  @IsOptional()
  @IsString()
  exportEligibility?: string;

  @ApiPropertyOptional({
    example: 'None specified',
    description: 'Informational in Phase 1.',
  })
  @IsOptional()
  @IsString()
  countryRestrictions?: string;

  @ApiPropertyOptional({ example: '10-15 business days' })
  @IsOptional()
  @IsString()
  estimatedDeliveryText?: string;

  @ApiPropertyOptional({ example: 'Estimates vary by destination.' })
  @IsOptional()
  @IsString()
  dutiesTaxesNote?: string;

  @ApiPropertyOptional({
    type: [PriceTierDto],
    description: 'Optional bulk pricing. Ranges must not overlap.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTierDto)
  priceTiers?: PriceTierDto[];
}
