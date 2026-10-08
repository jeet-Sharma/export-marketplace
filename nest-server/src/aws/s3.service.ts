import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from '../config/aws.config.js';
import { S3_CLIENT } from './aws.constants.js';

export interface UploadObjectInput {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface StoredObject {
  key: string;
  size?: number;
  lastModified?: Date;
}

/**
 * Thin wrapper around the S3 client exposing the operations the marketplace
 * needs for document storage. Works identically against LocalStack and real
 * AWS — the client is configured once in AwsModule.
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucket: string;

  constructor(
    @Inject(S3_CLIENT) private readonly client: S3Client,
    @Inject(awsConfig.KEY)
    private readonly config: ConfigType<typeof awsConfig>,
  ) {
    this.bucket = this.config.s3.bucket;
  }

  // ─── Product image helpers ──────────────────────────────────────────────
  // These exist specifically for the admin product-image upload flow (see
  // ProductsService.requestImageUploadUrl/addImage) and enforce the
  // security/validation requirements from Phase-1-API-Specification-v0.1
  // section 15 ("Restrict product image type, size and upload behavior";
  // never trust a client-supplied storage key without verifying it).

  // Builds a stable, collision-resistant object key scoped to a product.
  // Prefixes with a randomUUID() and sanitizes the filename to prevent
  // path traversal and filename collisions — see security-rules.md.
  buildProductImageKey(productId: string, originalFilename: string): string {
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `products/${productId}/${randomUUID()}-${sanitized}`;
  }

  // Returns true if `key` falls under the prefix buildProductImageKey()
  // generates for `productId`. Callers must check this before persisting
  // a client-supplied object key as that product's image metadata —
  // without it, an admin with product.edit on any product could attach
  // another product's (or an arbitrary) bucket key to a different
  // product's metadata. See ProductsService.addImage.
  keyBelongsToProduct(key: string, productId: string): boolean {
    return key.startsWith(`products/${productId}/`);
  }

  // Confirms the object actually exists in the bucket and returns its
  // real size. Used two ways in ProductsService.addImage: (1) a bogus or
  // not-yet-uploaded key can't be recorded as if the upload had
  // succeeded, and (2) the object's actual size — not merely a
  // client-declared one — is checked against MAX_IMAGE_UPLOAD_BYTES, the
  // authoritative size enforcement (see getPresignedUploadUrl's comment
  // for why a presigned PUT can't enforce a hard ceiling by itself).
  async getObjectMetadata(
    key: string,
  ): Promise<{ exists: true; sizeBytes: number } | { exists: false }> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return { exists: true, sizeBytes: result.ContentLength ?? 0 };
    } catch (error) {
      if (this.isNotFound(error)) {
        return { exists: false };
      }
      throw error;
    }
  }

  /** Uploads an object and returns its key. */
  async upload(input: UploadObjectInput): Promise<{ key: string }> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    };
    await this.client.send(new PutObjectCommand(params));
    this.logger.log(`Uploaded s3://${this.bucket}/${input.key}`);
    return { key: input.key };
  }

  /** Fetches an object's body as a Buffer. Returns null if it does not exist. */
  async getObject(key: string): Promise<Buffer | null> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!result.Body) {
        return null;
      }
      const bytes = await result.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      if (this.isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generates a time-limited presigned URL for downloading an object.
   * @param expiresInSeconds URL lifetime in seconds (default 15 minutes).
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
    return this.toPublicUrl(url);
  }

  /**
   * Generates a time-limited presigned URL for uploading an object directly.
   *
   * Size limit note: this deliberately does NOT set ContentLength on the
   * PutObjectCommand to cap upload size. A presigned PUT's ContentLength,
   * if set, must match the uploaded body EXACTLY — it's not a ceiling, so
   * setting it to a max byte count would reject every upload that isn't
   * precisely that size, which is wrong. The real max-size enforcement
   * happens after upload via getObjectMetadata()'s HeadObjectCommand
   * check against the object as actually stored (see
   * ProductsService.addImage). A true pre-upload hard ceiling would
   * require createPresignedPost's content-length-range condition instead
   * of a plain presigned PUT — not needed for Phase 1's two-step
   * (declared size in the DTO + post-upload actual-size) check.
   */
  async getPresignedUploadUrl(
    key: string,
    expiresInSeconds = 900,
    contentType?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
    });
    return this.toPublicUrl(url);
  }

  /**
   * Rewrites the host of a presigned URL to the configured public endpoint so
   * clients outside the Docker network can reach it. For path-style URLs the
   * SigV4 signature does not cover the host, so swapping only the authority
   * (scheme + host + port) leaves the signature valid. When no public endpoint
   * is configured (production/real AWS), the URL is returned unchanged.
   */
  private toPublicUrl(signedUrl: string): string {
    const publicEndpoint = this.config.s3.publicEndpoint;
    if (!publicEndpoint) {
      return signedUrl;
    }
    try {
      const signed = new URL(signedUrl);
      const target = new URL(publicEndpoint);
      signed.protocol = target.protocol;
      signed.host = target.host; // host includes port
      return signed.toString();
    } catch (error) {
      this.logger.warn(
        `Failed to rewrite presigned URL host to "${publicEndpoint}": ${
          (error as Error).message
        }. Returning the original URL.`,
      );
      return signedUrl;
    }
  }

  /**
   * Lists objects, optionally filtered by key prefix.
   *
   * ListObjectsV2 returns at most 1000 keys per response, so this follows the
   * NextContinuationToken until the bucket is fully enumerated — otherwise
   * large buckets would silently return only the first page.
   */
  async list(prefix?: string): Promise<StoredObject[]> {
    const objects: StoredObject[] = [];
    let continuationToken: string | undefined;

    do {
      const result = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      for (const item of result.Contents ?? []) {
        objects.push({
          key: item.Key ?? '',
          size: item.Size,
          lastModified: item.LastModified,
        });
      }

      // IsTruncated indicates more pages; NextContinuationToken fetches them.
      continuationToken = result.IsTruncated
        ? result.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return objects;
  }

  /** Deletes an object. No error is thrown if the key does not exist. */
  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`Deleted s3://${this.bucket}/${key}`);
  }

  private isNotFound(error: unknown): boolean {
    const name = (error as { name?: string })?.name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    return name === 'NoSuchKey' || name === 'NotFound' || status === 404;
  }
}
