import { ApiProperty } from '@nestjs/swagger';
import { ProductImage } from '../../../database/entities/product-image.entity.js';
import type { StorageStrategy } from '../../../storage/storage-strategy.interface.js';

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

  // Previously missing entirely — clients had no way to actually display
  // an image, only the bare, provider-specific storage key (see Qodo
  // review Bug #13). Resolved via StorageStrategy.getDisplayUrl, which
  // handles S3 (private bucket, requires a time-limited presigned GET)
  // and Cloudinary (public asset, permanent direct delivery URL)
  // differently but returns the same single string either way — the
  // client never needs to know which provider is active.
  @ApiProperty({
    description:
      'Ready-to-use URL for displaying this image. For S3 this is a ' +
      'time-limited presigned URL (see expiresInSeconds-equivalent TTL ' +
      'used when generating it); for Cloudinary this is a permanent, ' +
      'public delivery URL.',
    example: 'https://bucket.s3.amazonaws.com/products/<id>/<image-id>.jpg?...',
  })
  url!: string;

  @ApiProperty({ nullable: true, example: 'Organic turmeric powder' })
  altText!: string | null;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  sortOrder!: number;
}

// Default lifetime for the presigned display URL generated when the active
// strategy is S3 — long enough that a client rendering a product page
// doesn't hit an expired <img src> mid-session, short enough that a leaked
// URL (e.g. via browser history/referrer) doesn't stay valid indefinitely.
// Ignored entirely by CloudinaryStorageStrategy (its delivery URLs don't
// expire) — see StorageStrategy.getDisplayUrl's doc comment.
export const DISPLAY_URL_TTL_SECONDS = 3600;

export async function toProductImageResponseDto(
  image: ProductImage,
  storageStrategy: StorageStrategy,
): Promise<ProductImageResponseDto> {
  return {
    id: image.id,
    productId: image.productId,
    objectKey: image.s3ObjectKey,
    url: await storageStrategy.getDisplayUrl(
      image.s3ObjectKey,
      DISPLAY_URL_TTL_SECONDS,
    ),
    altText: image.altText,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder,
  };
}
