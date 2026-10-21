import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Fields accepted when a Maker creates a new product (Part 3.1). Maps to
 * `product` columns that are NOT set by the server (organization_id,
 * created_by, status, row_version, timestamps, public_id, search) or that
 * belong to child tables (price tiers, target countries, media).
 *
 * Validation mirrors the CHECK constraints in CreateVendorCatalog1732800000003
 * exactly — base_price >= 0, moq > 0 — nothing stricter is invented here.
 */
export class CreateProductDto {
  @IsNumber()
  @IsPositive()
  categoryId!: number;

  // char(6), FK -> hs_code(code). Optional per schema (product.hs_code is nullable).
  @IsOptional()
  @IsString()
  @Length(6, 6)
  hsCode?: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsObject()
  nameI18n?: Record<string, string>;

  // Unique within the organization (organization_id, slug) — enforced by the
  // DB unique index; the service surfaces that as a 409, not re-validated here.
  @IsString()
  @MinLength(1)
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  descriptionI18n?: Record<string, string>;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  // CHECK (base_price >= 0)
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsString()
  @Length(3, 3)
  baseCurrency!: string;

  // CHECK (moq > 0)
  @IsNumber()
  @IsPositive()
  moq!: number;

  @IsString()
  unit!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  widthCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsBoolean()
  isQuoteOnly?: boolean;
}
