/** DI tokens for the shared AWS SDK clients. */
export const S3_CLIENT = Symbol('S3_CLIENT');
export const SQS_CLIENT = Symbol('SQS_CLIENT');

// Max accepted product image size, in bytes. Phase-1-API-Specification-v0.1
// section 15 requires restricting "product image type, size and upload
// behavior" — type is enforced via RequestUploadUrlDto's contentType
// allowlist; this is the size half. 5MB is a reasonable default for
// catalogue imagery; revisit if product photography needs higher
// resolution than this comfortably allows.
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
