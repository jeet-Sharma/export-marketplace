import { ApiProperty } from '@nestjs/swagger';

// Returned by ProductsService.requestImageUploadUrl. The client submits a
// multipart/form-data POST directly to `uploadUrl`, with every entry in
// `fields` included as form fields (in the given order) followed by the
// file itself as a `file` field — the server never sees the file bytes.
// This is a signed-POST upload (not a plain PUT) specifically so the
// storage provider can enforce the maximum upload size itself; see
// S3Service.getPresignedUploadPost's comment for why a plain presigned PUT
// could not do this. `key` is the stable object key/public_id to persist
// via POST /admin/products/:id/images (CreateProductImageDto.objectKey) —
// never store the signed URL/fields themselves, they're time-limited.
export class UploadUrlResponseDto {
  @ApiProperty({
    description:
      'Time-limited presigned POST target. Submit a multipart/form-data ' +
      'POST here with `fields` as form fields plus the file as `file`.',
  })
  uploadUrl!: string;

  @ApiProperty({
    description:
      'Form fields to include in the POST, in order, before the file field.',
    example: {
      key: 'products/<product-id>/<uuid>-photo.jpg',
      'Content-Type': 'image/jpeg',
      policy: '...',
      'x-amz-signature': '...',
    },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  fields!: Record<string, string>;

  @ApiProperty({ example: 'products/<product-id>/<uuid>-photo.jpg' })
  key!: string;

  @ApiProperty({ example: 900 })
  expiresInSeconds!: number;
}
