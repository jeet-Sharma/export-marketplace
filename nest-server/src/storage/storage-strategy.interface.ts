// Common storage contract so business services (ProductsService) depend on
// an abstraction, not a concrete provider (S3Service / CloudinaryStorageService
// directly). Shaped around the operations ProductsService actually calls today
// (buildProductImageKey, getPresignedUploadUrl, keyBelongsToProduct,
// getObjectMetadata, delete) — see S3Service for the original implementation
// this wraps. Method names/signatures intentionally mirror S3Service's
// existing ones so S3StorageStrategy is a thin delegate, not a rewrite.

/**
 * Result of resolving object metadata — mirrors S3Service.getObjectMetadata.
 * `detectedContentType` is the MIME type inferred from the object's actual
 * bytes (file-signature/magic-number sniffing for S3; Cloudinary reports
 * its own detected format directly), never the client-declared
 * Content-Type header — see ProductsService.addImage's content-type check,
 * which is the server-side enforcement Bug #12 requires. `undefined` means
 * the strategy could not determine a type (e.g. too few bytes, or an
 * unrecognized signature); callers must treat that as "not a trusted image"
 * rather than silently accepting it.
 */
export type StorageObjectMetadata =
  | { exists: true; sizeBytes: number; detectedContentType?: string }
  | { exists: false };

/**
 * A provider-signed upload the client submits directly (never through this
 * backend). Both current providers (S3, Cloudinary) use a signed
 * multipart/form-data POST — `httpMethod` is included explicitly rather
 * than left for the client to assume, so the contract is self-describing
 * and doesn't silently break if a future provider needs a different verb.
 * `fields` carries whatever the provider's signed-POST policy requires
 * (S3: policy/signature/key/Content-Type; Cloudinary: public_id/timestamp/
 * api_key/signature) in addition to the file itself — the client sends a
 * multipart/form-data POST to `url` with every entry in `fields` as its own
 * form field, PLUS the file itself as a `file` field added LAST (both S3's
 * POST policy and Cloudinary's upload API require the file field to come
 * after every other field in the multipart body). This is a POST, not a
 * presigned PUT, specifically so the provider can enforce `maxSizeBytes`
 * itself (S3's `content-length-range` policy condition) rather than relying
 * only on this API's post-upload check, which can't stop bytes that already
 * landed in storage — see S3Service.getPresignedUploadPost's comment.
 */
export interface PresignedUpload {
  url: string;
  /** Always 'POST' today; kept explicit rather than assumed by the client. */
  httpMethod: 'POST';
  fields: Record<string, string>;
  /**
   * The upload authorization's ACTUAL expiry in seconds from now — not
   * necessarily the `expiresInSeconds` the caller requested. S3 honors the
   * requested value exactly (its POST policy's `Expires` is fully
   * caller-controlled). Cloudinary does not: a signed upload's `timestamp`
   * is valid for a fixed, provider-enforced window (~3600s) that cannot be
   * shortened or extended per-request — see CloudinaryStorageStrategy's
   * getPresignedUpload comment. Callers (ProductsService) must return THIS
   * value to the API client, not the originally requested one, so the API
   * contract never claims an expiry shorter than what's actually
   * enforced — see Qodo review Bug #11.
   */
  expiresInSeconds: number;
}

export interface StorageStrategy {
  /**
   * Builds a stable, collision-resistant object key/identifier scoped to a
   * product. For S3 this is the literal object key; for Cloudinary this is
   * used as the `public_id` (Cloudinary has no native folder "key" concept,
   * but public_id supports the same `products/<id>/<uuid>-name` shape).
   */
  buildProductImageKey(productId: string, originalFilename: string): string;

  /**
   * Returns true if `key` falls under the prefix buildProductImageKey()
   * generates for `productId`. Must be checked before trusting a
   * client-supplied key — see S3Service.keyBelongsToProduct's security note.
   */
  keyBelongsToProduct(key: string, productId: string): boolean;

  /**
   * Generates a time-limited, provider-signed upload (see PresignedUpload)
   * the client submits directly to the provider. The backend never
   * receives the file bytes. `maxSizeBytes` is enforced by the provider
   * itself at upload time — the request is rejected before the object is
   * ever stored if the uploaded body exceeds it, closing the gap a plain
   * presigned PUT (whose ContentLength must match exactly, so it can't act
   * as a ceiling) leaves open.
   */
  getPresignedUpload(
    key: string,
    expiresInSeconds: number,
    maxSizeBytes: number,
    contentType?: string,
  ): Promise<PresignedUpload>;

  /**
   * Confirms the object actually exists at the provider and returns its
   * real size, used for the authoritative post-upload size check.
   */
  getObjectMetadata(key: string): Promise<StorageObjectMetadata>;

  /** Deletes an object. Must not throw if the key does not exist. */
  delete(key: string): Promise<void>;

  /**
   * Returns a URL the client can use directly (e.g. in an <img src>) to
   * display the object — the piece previously missing entirely from the
   * product image response (ProductImageResponseDto exposed only the bare
   * storage key, which isn't a browsable URL for either provider).
   *
   * S3: the bucket is private, so this ALWAYS requires a time-limited
   * presigned GET URL (S3Service.getPresignedDownloadUrl) — there is no
   * unsigned/direct S3 URL option, since the objects are not public.
   * Cloudinary: assets uploaded via the signed-upload flow are public by
   * default under the account's cloud_name, so this returns a plain,
   * permanent delivery URL — no signing, no expiry, and `expiresInSeconds`
   * is ignored.
   *
   * `expiresInSeconds` only has meaning for S3; Cloudinary's return value
   * does not expire. Defaults are chosen per-call-site (see
   * toProductImageResponseDto) rather than hardcoded here, so callers
   * displaying a URL for a long time (e.g. a cached product listing) can
   * request a correspondingly longer TTL than a one-off admin preview.
   */
  getDisplayUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

/** DI token business services inject instead of depending on a concrete class. */
export const STORAGE_STRATEGY = Symbol('STORAGE_STRATEGY');

/** Supported values for the STORAGE_PROVIDER environment variable. */
export const STORAGE_PROVIDERS = ['s3', 'cloudinary'] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];
