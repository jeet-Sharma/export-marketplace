// Returned by StorageService.getSignedUploadUrl. The client PUTs the file
// directly to `uploadUrl`; the server never sees the file bytes. `key` is
// the stable S3 object key to persist in product_images.s3_object_key —
// never store the signed URL itself (it's time-limited).
export class UploadUrlResponseDto {
  uploadUrl!: string;
  key!: string;
  expiresInSeconds!: number;
}
