// Returned by ProductsService.requestImageUploadUrl. The client PUTs the
// file directly to `uploadUrl`; the server never sees the file bytes.
// `key` is the stable S3 object key to persist via
// POST /admin/products/:id/images (CreateProductImageDto.objectKey) —
// never store the signed URL itself, it's time-limited.
export class UploadUrlResponseDto {
  uploadUrl!: string;
  key!: string;
  expiresInSeconds!: number;
}
