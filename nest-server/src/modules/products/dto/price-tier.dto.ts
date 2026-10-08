import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';

// Mirrors Phase-1-API-Specification-v0.1 section 8 (Price Tier Contract).
// Accepts plain JSON numbers per the API contract's examples; the service
// layer converts to the `numeric` string columns ProductPriceTier expects
// — never round-trip through JS floating point for the persisted value
// itself (see marketplace-domain.md's money-handling rule).
export class PriceTierDto {
  @ApiProperty({
    example: 100,
    description: 'Minimum quantity for this tier; must be > 0.',
  })
  @IsNumber()
  @Min(0.0001, { message: 'minQuantity must be greater than 0' })
  minQuantity!: number;

  @ApiPropertyOptional({
    example: 499,
    nullable: true,
    description: 'null means open-ended (no upper bound).',
  })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  maxQuantity?: number | null;

  @ApiProperty({
    example: 8.5,
    description: 'Unit price for this quantity tier.',
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 1.2, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  shippingEstimate?: number | null;

  @ApiPropertyOptional({ example: 0.8, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
  dutiesEstimate?: number | null;

  @ApiPropertyOptional({ example: 0.5, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value) => value !== null)
  @IsNumber()
  @Min(0)
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
