import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  MinLength,
} from 'class-validator';

// Admin category creation — supplies the categoryId CreateProductDto
// accepts (products.category_id, nullable but FK-restricted when set).
// slug is derived server-side from name (never client-supplied) to keep
// slug generation consistent with how ProductsService.generateUniqueSlug
// already treats slugs as a derived, system-owned value rather than
// client input.
export class CreateCategoryDto {
  @ApiProperty({ example: 'Spices & Seasonings', maxLength: 150 })
  @IsString()
  @MinLength(1)
  @Length(1, 150)
  name!: string;

  @ApiPropertyOptional({
    example: 'Export-grade spices, herbs, and seasoning blends.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
