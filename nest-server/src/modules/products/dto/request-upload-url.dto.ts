import { IsIn, IsString, MinLength } from 'class-validator';

// Not explicitly itemized as its own row in API spec section 4/9 — the
// spec's section 9 intro says "the exact upload implementation may use
// direct multipart upload or a presigned-S3 flow" and leaves the exact
// shape open. This DTO backs the presigned-URL half of that flow: the
// client calls POST /admin/products/:id/images/upload-url first to get a
// short-lived PUT URL, uploads directly to S3, then calls
// POST /admin/products/:id/images (CreateProductImageDto) to persist the
// resulting object key as metadata.
export class RequestUploadUrlDto {
  @IsString()
  @MinLength(1)
  filename!: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: 'image/jpeg' | 'image/png' | 'image/webp';
}
