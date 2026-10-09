/** DI tokens for the shared AWS SDK clients. */
export const S3_CLIENT = Symbol('S3_CLIENT');

// Separate client used ONLY to generate presigned URLs for external
// (browser) clients. Signed against AWS_S3_PUBLIC_ENDPOINT when set,
// instead of the internal AWS_ENDPOINT (e.g. http://localstack:4566) —
// see aws.config.ts's s3.publicEndpoint comment for why a presigned URL's
// host cannot be safely rewritten after signing (SigV4 signs the Host).
export const S3_PRESIGNING_CLIENT = Symbol('S3_PRESIGNING_CLIENT');

// Max accepted product image size, in bytes. Phase-1-API-Specification-v0.1
// section 15 requires restricting "product image type, size and upload
// behavior" — type is enforced via RequestUploadUrlDto's contentType
// allowlist; this is the size half. 5MB is a reasonable default for
// catalogue imagery; revisit if product photography needs higher
// resolution than this comfortably allows.
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
