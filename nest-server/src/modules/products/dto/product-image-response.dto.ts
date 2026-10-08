import { ApiProperty } from '@nestjs/swagger';
import { ProductImage } from '../../../database/entities/product-image.entity.js';

// Maps ProductImage onto the shape documented in
// Phase-1-API-Specification-v0.1 section 9.1's example response. The
// entity's column is named s3ObjectKey (deliberately, so the DB schema
// makes clear the key lives in S3 — see product-image.entity.ts), but the
// API contract calls the field objectKey; this mapper is the one place
// that translation happens; never rename the entity column to match the
// API field name — that would just move the mismatch to the DB layer.
export class ProductImageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({ example: 'products/<product-id>/<image-id>.jpg' })
  objectKey!: string;

  @ApiProperty({ nullable: true, example: 'Organic turmeric powder' })
  altText!: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  sortOrder!: number;
}

export function toProductImageResponseDto(
  image: ProductImage,
): ProductImageResponseDto {
  return {
    id: image.id,
    productId: image.productId,
    objectKey: image.s3ObjectKey,
    altText: image.altText,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
  };
}
