import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  ALLOWED_IMAGE_FORMATS,
  type AllowedImageContentType,
} from '../aws/aws.constants.js';
import { cloudinaryConfig } from '../config/cloudinary.config.js';
import type {
  PresignedUpload,
  StorageObjectMetadata,
  StorageStrategy,
} from './storage-strategy.interface.js';

/** Maps the client-declared image Content-Type to Cloudinary's format name. */
const CONTENT_TYPE_TO_CLOUDINARY_FORMAT: Record<
  AllowedImageContentType,
  string
> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Reverse of CONTENT_TYPE_TO_CLOUDINARY_FORMAT — maps the format Cloudinary
 * reports back (detected from the actual uploaded bytes, via its own
 * server-side content inspection) to the Content-Type ProductsService.addImage
 * checks against ALLOWED_IMAGE_CONTENT_TYPES. Cloudinary normalizes jpeg's
 * extension to "jpg", hence the explicit key here rather than deriving it
 * from the MIME type string.
 */
const CLOUDINARY_FORMAT_TO_CONTENT_TYPE: Record<
  string,
  AllowedImageContentType
> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Cloudinary's signed-upload `timestamp` parameter is only accepted within a
 * fixed, provider-enforced window of its own clock — documented by
 * Cloudinary as approximately one hour — and this is NOT configurable
 * per-request (unlike S3's POST policy `Expires`, which the caller sets
 * directly). There is no signed parameter that can shorten or extend it.
 * This constant documents the actual enforced behavior so
 * getPresignedUpload can report a truthful `expiresInSeconds` back to
 * callers instead of echoing whatever the caller asked for — see Qodo
 * review Bug #11 and PresignedUpload's doc comment.
 */
const CLOUDINARY_SIGNATURE_VALIDITY_SECONDS = 3600;

/**
 * Cloudinary-backed StorageStrategy. Mirrors S3StorageStrategy's contract so
 * ProductsService works unchanged regardless of which strategy is active.
 *
 * Upload model: Cloudinary has no S3-style presigned PUT URL — a *signed
 * upload* is the provider-agnostic equivalent that keeps this a true
 * direct-to-provider upload (the backend never receives file bytes, same as
 * the S3 flow). The backend signs a parameter set (public_id, timestamp)
 * with the API secret via `getPresignedUpload` below, and the client sends a
 * multipart/form-data POST directly to Cloudinary's upload endpoint with
 * those signed params as form fields plus the file itself — returned as the
 * same `{ url, httpMethod, fields }` shape S3StorageStrategy returns (see
 * `PresignedUpload` in storage-strategy.interface.ts), so ProductsService
 * and the API contract are identical regardless of which provider is
 * active. Earlier versions of this file encoded the signed params as a query
 * string on the URL and returned a bare string — that doesn't match how
 * Cloudinary's upload API or S3's POST policy actually work (both require
 * the signed params as multipart form fields, not query params), which is
 * what this method now returns correctly.
 *
 * Credential validation is deliberately NOT done in the constructor: this
 * class is always instantiated by StorageModule regardless of which
 * provider is active (see storage.module.ts), so throwing here would break
 * app startup under STORAGE_PROVIDER=s3 whenever Cloudinary credentials
 * happen to be unset — which is the normal/expected case for local and
 * production environments. Instead, credentials are validated lazily, the
 * first time this strategy is actually asked to do something — which only
 * happens once storage.module.ts's factory has selected it, i.e. once
 * STORAGE_PROVIDER=cloudinary. This keeps the "fail fast when Cloudinary is
 * selected but misconfigured" requirement while leaving the S3-selected path
 * fully unaffected by Cloudinary's env vars being absent.
 */
@Injectable()
export class CloudinaryStorageStrategy implements StorageStrategy {
  private readonly logger = new Logger(CloudinaryStorageStrategy.name);
  private configured = false;

  constructor(
    @Inject(cloudinaryConfig.KEY)
    private readonly config: ConfigType<typeof cloudinaryConfig>,
  ) {}

  /**
   * Validates and applies Cloudinary credentials to the SDK's global config.
   * Called before every operation (configureClient is idempotent after the
   * first successful call) so misconfiguration is caught immediately on the
   * first real use of this strategy, with a clear error, rather than
   * surfacing as an opaque Cloudinary auth failure deep in the SDK.
   */
  ensureConfigured(): void {
    if (this.configured) {
      return;
    }
    const { cloudName, apiKey, apiSecret } = this.config;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ServiceUnavailableException({
        code: 'STORAGE_MISCONFIGURED',
        message:
          'Cloudinary storage is selected (STORAGE_PROVIDER=cloudinary) but ' +
          'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET ' +
          'are not fully set.',
      });
    }
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true, // always return/sign https URLs
    });
    this.configured = true;
  }

  /**
   * Builds a Cloudinary public_id scoped to a product, matching S3's
   * `products/<productId>/<uuid>-<sanitized-filename>` convention (minus the
   * file extension, which Cloudinary tracks separately via `format`).
   */
  buildProductImageKey(productId: string, originalFilename: string): string {
    const withoutExtension = originalFilename.replace(/\.[^./]+$/, '');
    const sanitized = withoutExtension.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `products/${productId}/${randomUUID()}-${sanitized}`;
  }

  keyBelongsToProduct(key: string, productId: string): boolean {
    return key.startsWith(`products/${productId}/`);
  }

  /**
   * Returns a Cloudinary signed-upload POST target: the client submits a
   * multipart/form-data POST to `url` carrying every entry in `fields`
   * (public_id, timestamp, allowed_formats, api_key, signature) plus the
   * file itself, added last.
   *
   * File-type enforcement: `allowed_formats` is signed into the request
   * (included in paramsToSign below), so Cloudinary itself verifies the
   * ACTUAL uploaded file's detected format server-side and rejects the
   * upload if it doesn't match — not merely the client-declared
   * Content-Type header, which a malicious or buggy client could set to
   * anything regardless of the real file content. Because it's part of
   * the signed payload, a client cannot widen or strip this restriction
   * without invalidating the signature. `contentType` is required (not
   * optional) for this strategy specifically so there's always a format
   * to translate and sign — see CONTENT_TYPE_TO_CLOUDINARY_FORMAT.
   *
   * IMPORTANT size-enforcement limitation (unlike S3StorageStrategy):
   * Cloudinary's raw signed-upload API has no server-enforced hard byte
   * ceiling equivalent to S3 POST policy's `content-length-range` — Cloudinary
   * only exposes a client-side `maxFileSize` option on its upload *widget*,
   * which a malicious or buggy client can simply not apply. `maxSizeBytes` is
   * therefore NOT enforced provider-side here; ProductsService.addImage's
   * existing post-upload size check (delete-then-reject if oversized) is
   * still the only real backstop for this strategy. Flagged rather than
   * silently claimed-equivalent to S3's enforcement — if Cloudinary is used
   * somewhere this gap matters, an eager async-moderation webhook or a
   * stricter upload preset enforced on the Cloudinary account itself would
   * be the next step, which is out of scope for this fix.
   *
   * IMPORTANT expiry limitation (unlike S3StorageStrategy): the requested
   * `expiresInSeconds` is NOT honored. Cloudinary's signed `timestamp` is
   * only valid for a fixed, provider-enforced window
   * (CLOUDINARY_SIGNATURE_VALIDITY_SECONDS, ~1 hour) that cannot be
   * shortened or lengthened per-request — there is no signed parameter for
   * this. The returned `PresignedUpload.expiresInSeconds` reports that
   * ACTUAL enforced window rather than echoing the input, so the API
   * contract never understates (or overstates) how long the upload URL
   * stays valid — see Qodo review Bug #11.
   */
  async getPresignedUpload(
    key: string,
    _expiresInSeconds: number,
    _maxSizeBytes: number,
    contentType?: string,
  ): Promise<PresignedUpload> {
    this.ensureConfigured();

    const format =
      CONTENT_TYPE_TO_CLOUDINARY_FORMAT[
        contentType as AllowedImageContentType
      ];
    if (!format) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Unsupported image content type for Cloudinary upload',
        errors: [
          {
            field: 'contentType',
            message: `contentType must be one of: ${Object.keys(CONTENT_TYPE_TO_CLOUDINARY_FORMAT).join(', ')}`,
          },
        ],
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const allowedFormats = ALLOWED_IMAGE_FORMATS.join(',');
    const paramsToSign = {
      public_id: key,
      timestamp,
      allowed_formats: allowedFormats,
    };

    let signed: { signature: string; api_key: string };
    try {
      signed = cloudinary.utils.sign_request(paramsToSign, {
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
      });
    } catch (error) {
      this.logger.error(
        `Failed to sign Cloudinary upload request: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Unable to generate a Cloudinary upload URL',
      );
    }

    // The signed resource_type must match what the upload actually sends;
    // "auto" (used for getObjectMetadata/delete lookups when the type is
    // unknown) cannot be part of the signature here since the client would
    // then need to resend a resource_type field matching exactly what was
    // signed — "image" is correct and sufficient since this flow (and
    // ALLOWED_IMAGE_FORMATS) is image-only.
    const url = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;
    return {
      url,
      httpMethod: 'POST',
      fields: {
        public_id: key,
        timestamp: String(timestamp),
        allowed_formats: allowedFormats,
        api_key: signed.api_key,
        signature: signed.signature,
      },
      // Not the requested value — Cloudinary enforces its own fixed window
      // regardless of what was asked for. See the method's doc comment and
      // CLOUDINARY_SIGNATURE_VALIDITY_SECONDS.
      expiresInSeconds: CLOUDINARY_SIGNATURE_VALIDITY_SECONDS,
    };
  }

  /**
   * Confirms the asset exists and returns its byte size plus detected
   * content type, via Cloudinary's Admin API `resource` lookup — the
   * equivalent of S3's HeadObjectCommand. Tries `image` then `video`
   * resource types since the public_id alone doesn't indicate which; `raw`
   * is not attempted (unsupported media type for this flow — see
   * RequestUploadUrlDto's image-only allowlist).
   *
   * `detectedContentType` comes from Cloudinary's own `format` field,
   * which reflects what Cloudinary detected the asset actually is after
   * upload — not a client-declared value. `allowed_formats` (signed into
   * every upload via getPresignedUpload) already makes Cloudinary reject
   * a mismatched upload before it's ever stored, so by the time this
   * method runs the format should always be an allowed one; mapping it
   * back to a Content-Type here lets ProductsService.addImage apply the
   * exact same check uniformly across both storage strategies rather than
   * trusting Cloudinary's upload-time enforcement alone.
   */
  async getObjectMetadata(key: string): Promise<StorageObjectMetadata> {
    this.ensureConfigured();
    for (const resourceType of ['image', 'video'] as const) {
      try {
        const result = await cloudinary.api.resource(key, {
          resource_type: resourceType,
        });
        const detectedContentType = result.format
          ? CLOUDINARY_FORMAT_TO_CONTENT_TYPE[
              String(result.format).toLowerCase()
            ]
          : undefined;
        return {
          exists: true,
          sizeBytes: result.bytes ?? 0,
          detectedContentType,
        };
      } catch (error) {
        if (!this.isNotFound(error)) {
          this.logger.error(
            `Cloudinary resource lookup failed for "${key}": ${(error as Error).message}`,
          );
          throw new ServiceUnavailableException(
            'Unable to verify the uploaded file with Cloudinary',
          );
        }
      }
    }
    return { exists: false };
  }

  /**
   * Deletes an asset by public_id. Tries both image and video resource
   * types (same ambiguity as getObjectMetadata) and does not throw if the
   * asset is already gone, matching S3StorageStrategy.delete's semantics.
   */
  async delete(key: string): Promise<void> {
    this.ensureConfigured();
    for (const resourceType of ['image', 'video'] as const) {
      try {
        const result = await cloudinary.uploader.destroy(key, {
          resource_type: resourceType,
        });
        if (result?.result === 'ok' || result?.result === 'not found') {
          this.logger.log(
            `Cloudinary delete for "${key}" (${resourceType}): ${result.result}`,
          );
          if (result.result === 'ok') {
            return;
          }
        }
      } catch (error) {
        this.logger.error(
          `Cloudinary delete failed for "${key}" (${resourceType}): ${(error as Error).message}`,
        );
        throw new ServiceUnavailableException(
          'Unable to delete the file from Cloudinary',
        );
      }
    }
    // Neither resource type reported "ok" — asset was already absent under
    // both; treat as a successful no-op, same as S3's delete-of-missing-key.
  }

  private isNotFound(error: unknown): boolean {
    const httpCode = (error as { http_code?: number })?.http_code;
    return httpCode === 404;
  }

  /**
   * Builds Cloudinary's direct delivery URL for an image: assets uploaded
   * via the signed-upload flow above are public under the account's
   * cloud_name, so this is a plain string template — no signing, no
   * expiry, and no SDK/network call needed (unlike S3's presigned GET).
   * `expiresInSeconds` is accepted for interface parity with
   * S3StorageStrategy but is intentionally unused: Cloudinary delivery
   * URLs for public assets do not expire.
   */
  async getDisplayUrl(key: string, _expiresInSeconds?: number): Promise<string> {
    this.ensureConfigured();
    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/${key}`;
  }
}
