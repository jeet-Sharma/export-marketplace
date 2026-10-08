import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// POST /admin/products/:id/images (section 9.1). The client has already
// uploaded the file to S3 via a presigned URL (see S3Service) and
// passes the resulting object key here to persist the metadata row —
// this endpoint never receives the image bytes itself.
export class CreateProductImageDto {
  @ApiProperty({ example: 'products/<product-id>/<uuid>-photo.jpg' })
  @IsString()
  @MinLength(1)
  objectKey!: string;

  @ApiPropertyOptional({ example: 'Organic turmeric powder' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Only one primary image per product.',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
