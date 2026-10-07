import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

// POST /admin/products/:id/images (section 9.1). The client has already
// uploaded the file to S3 via a presigned URL (see StorageService) and
// passes the resulting object key here to persist the metadata row —
// this endpoint never receives the image bytes itself.
export class CreateProductImageDto {
  @IsString()
  @MinLength(1)
  objectKey!: string;

  @IsOptional()
  @IsString()
  altText?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
