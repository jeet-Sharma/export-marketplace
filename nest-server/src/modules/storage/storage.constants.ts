// Max accepted product image size, in bytes. API spec section 15
// requires restricting "product image type, size and upload behavior" —
// type is enforced via RequestUploadUrlDto's contentType allowlist; this
// is the size half. 5MB is a reasonable default for catalogue imagery;
// revisit if product photography needs higher resolution than this
// comfortably allows.
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
