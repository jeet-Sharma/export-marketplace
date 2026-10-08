// Common storage contract so business services (ProductsService) depend on
// an abstraction, not a concrete provider (S3Service / CloudinaryStorageService
// directly). Shaped around the operations ProductsService actually calls today
// (buildProductImageKey, getPresignedUploadUrl, keyBelongsToProduct,
// getObjectMetadata, delete) — see S3Service for the original implementation
// this wraps. Method names/signatures intentionally mirror S3Service's
// existing ones so S3StorageStrategy is a thin delegate, not a rewrite.

/** Result of resolving object metadata — mirrors S3Service.getObjectMetadata. */
export type StorageObjectMetadata =
  | { exists: true; sizeBytes: number }
  | { exists: false };

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
   * Generates a time-limited URL (or signed upload payload serialized as a
   * URL — see CloudinaryStorageStrategy) the client uses to upload the file
   * directly to the provider. The backend never receives the file bytes.
   */
  getPresignedUploadUrl(
    key: string,
    expiresInSeconds: number,
    contentType?: string,
  ): Promise<string>;

  /**
   * Confirms the object actually exists at the provider and returns its
   * real size, used for the authoritative post-upload size check.
   */
  getObjectMetadata(key: string): Promise<StorageObjectMetadata>;

  /** Deletes an object. Must not throw if the key does not exist. */
  delete(key: string): Promise<void>;
}

/** DI token business services inject instead of depending on a concrete class. */
export const STORAGE_STRATEGY = Symbol('STORAGE_STRATEGY');

/** Supported values for the STORAGE_PROVIDER environment variable. */
export const STORAGE_PROVIDERS = ['s3', 'cloudinary'] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];
