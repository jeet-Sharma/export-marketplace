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

// Single source of truth for which product image MIME types/formats are
// accepted, shared by RequestUploadUrlDto's client-declared contentType
// validator AND the server-side, content-based checks each storage
// strategy performs: S3StorageStrategy verifies the actually-uploaded
// object's magic-number signature in getObjectMetadata (see that method);
// CloudinaryStorageStrategy signs `allowed_formats` into the upload
// request so Cloudinary itself rejects a mismatched upload based on the
// real file content, not the client-declared Content-Type header, which a
// malicious or buggy client can set to anything regardless of the actual
// bytes it sends.
export const ALLOWED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type AllowedImageContentType =
  (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

// Cloudinary identifies formats by file extension, not MIME type — this is
// the `allowed_formats` equivalent of ALLOWED_IMAGE_CONTENT_TYPES above.
export const ALLOWED_IMAGE_FORMATS = ['jpg', 'png', 'webp'] as const;

// Magic-number (file signature) prefixes for the allowed image types,
// used to verify the ACTUAL uploaded content server-side rather than
// trusting the client-declared Content-Type — see
// S3StorageStrategy.getObjectMetadata's content-sniffing check. JPEG has
// two common signatures (both start with the same SOI marker + APPn, but
// checking just the first 3 bytes, 0xFFD8FF, catches every JPEG variant in
// practice). PNG and WebP each have one fixed signature.
export const IMAGE_MAGIC_NUMBERS: ReadonlyArray<{
  contentType: AllowedImageContentType;
  signature: readonly number[];
}> = [
  { contentType: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  { contentType: 'image/png', signature: [0x89, 0x50, 0x4e, 0x47] },
  // WebP: "RIFF" (bytes 0-3) + size (4-7) + "WEBP" (bytes 8-11). Only the
  // "RIFF"/"WEBP" markers are checked; the 4-byte size field in between is
  // not part of the signature.
  { contentType: 'image/webp', signature: [0x52, 0x49, 0x46, 0x46] },
];
