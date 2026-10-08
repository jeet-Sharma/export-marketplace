import { randomUUID } from 'node:crypto';
import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryConfig } from '../config/cloudinary.config.js';
import type {
  StorageObjectMetadata,
  StorageStrategy,
} from './storage-strategy.interface.js';

/**
 * Cloudinary-backed StorageStrategy. Mirrors S3StorageStrategy's contract so
 * ProductsService works unchanged regardless of which strategy is active.
 *
 * Upload model: Cloudinary has no S3-style presigned PUT URL. The
 * provider-agnostic equivalent — and what keeps this a true direct-to-provider
 * upload (the backend never receives file bytes, same as the S3 flow) — is a
 * *signed upload*: the backend signs a small parameter set (public_id,
 * timestamp, folder) with the API secret, and the client POSTs the file plus
 * those signed params directly to Cloudinary's upload endpoint. This method
 * still returns a single string to satisfy the existing
 * `getPresignedUploadUrl(): Promise<string>` contract: the signed params are
 * serialized onto the Cloudinary upload endpoint URL as a query string, so
 * the caller's shape (`UploadUrlResponseDto.uploadUrl`) doesn't change — only
 * the client-side upload mechanics differ (a signed POST instead of a plain
 * PUT), which is unavoidable given Cloudinary's API and is documented for
 * whoever implements the dev-environment upload client.
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
   * Returns a Cloudinary signed-upload URL: the official unsigned upload
   * endpoint with a signature + timestamp + api_key + public_id query
   * string the client echoes back as form fields on its POST. `contentType`
   * is accepted for interface parity with S3StorageStrategy but is not used
   * — Cloudinary infers resource type from the uploaded bytes.
   */
  async getPresignedUploadUrl(
    key: string,
    _expiresInSeconds: number,
    _contentType?: string,
  ): Promise<string> {
    this.ensureConfigured();
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { public_id: key, timestamp };

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

    const uploadEndpoint = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/auto/upload`;
    const query = new URLSearchParams({
      public_id: key,
      timestamp: String(timestamp),
      api_key: signed.api_key,
      signature: signed.signature,
    });
    return `${uploadEndpoint}?${query.toString()}`;
  }

  /**
   * Confirms the asset exists and returns its byte size, via Cloudinary's
   * Admin API `resource` lookup — the equivalent of S3's HeadObjectCommand.
   * Tries `image` then `video` resource types since the public_id alone
   * doesn't indicate which; `raw` is not attempted (unsupported media type
   * for this flow — see RequestUploadUrlDto's image/video-only allowlist).
   */
  async getObjectMetadata(key: string): Promise<StorageObjectMetadata> {
    this.ensureConfigured();
    for (const resourceType of ['image', 'video'] as const) {
      try {
        const result = await cloudinary.api.resource(key, {
          resource_type: resourceType,
        });
        return { exists: true, sizeBytes: result.bytes ?? 0 };
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
}
