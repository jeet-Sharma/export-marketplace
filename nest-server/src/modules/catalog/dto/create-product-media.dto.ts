import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Min, MinLength } from 'class-validator';

/**
 * Body for POST /catalog/products/:productId/media (Part 3.4).
 *
 * Metadata only — the file itself is uploaded first through the existing
 * StorageModule (POST /storage/upload), which returns the storage_key this
 * DTO references. This module does not touch S3/LocalStack directly; it
 * only records the pointer plus the fields the migration requires
 * (mime_type, size_bytes, sha256) alongside it.
 */
export class CreateProductMediaDto {
  @IsIn(['IMAGE', 'VIDEO'])
  mediaType!: 'IMAGE' | 'VIDEO';

  @IsString()
  @MinLength(1)
  storageKey!: string;

  @IsString()
  @MinLength(1)
  mimeType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  // d_sha256 domain: char(64), lowercase hex
  @IsString()
  @Length(64, 64)
  sha256!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
