import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { MAX_IMAGE_UPLOAD_BYTES } from '../../../aws/aws.constants.js';

// Not explicitly itemized as its own row in API spec section 4/9 — the
// spec's section 9 intro says "the exact upload implementation may use
// direct multipart upload or a presigned-S3 flow" and leaves the exact
// shape open. This DTO backs the presigned-URL half of that flow: the
// client calls POST /admin/products/:id/images/upload-url first to get a
// short-lived PUT URL, uploads directly to S3, then calls
// POST /admin/products/:id/images (CreateProductImageDto) to persist the
// resulting object key as metadata.
//
// contentLengthBytes: the client declares the file size upfront. This is
// the first of two size checks — see S3Service.getPresignedUploadUrl's
// comment for why a presigned PUT URL can't enforce a hard max by itself
// (ContentLength on a presigned PUT must match exactly, not just stay
// under a ceiling), and ProductsService.addImage's post-upload
// HeadObjectCommand check (via S3Service.getObjectMetadata) for the
// second, authoritative one.
export class RequestUploadUrlDto {
  @ApiProperty({ example: 'turmeric-powder.jpg' })
  @IsString()
  @MinLength(1)
  filename!: string;

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: 'image/jpeg' | 'image/png' | 'image/webp';

  @ApiProperty({
    example: 204800,
    maximum: MAX_IMAGE_UPLOAD_BYTES,
    description: `Declared file size in bytes; max ${MAX_IMAGE_UPLOAD_BYTES} (${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)}MB). The actual uploaded size is re-verified server-side after upload.`,
  })
  @IsInt()
  @Min(1)
  @Max(MAX_IMAGE_UPLOAD_BYTES, {
    message: `contentLengthBytes must not exceed ${MAX_IMAGE_UPLOAD_BYTES} bytes (${MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024)}MB)`,
  })
  contentLengthBytes!: number;
}
