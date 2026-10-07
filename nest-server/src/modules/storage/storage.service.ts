import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, type OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_CLIENT } from '../aws/aws-clients.tokens.js';
import { UploadUrlResponseDto } from './dto/upload-url-response.dto.js';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 900;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  // Tracks whether the configured bucket was reachable at startup. If
  // not, public methods fail fast with a clear 503 instead of letting
  // every upload attempt throw a raw, confusing SDK error — mirrors the
  // "don't hard-fail app boot on optional external dependencies" pattern.
  private available = true;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.getOrThrow<string>('aws.s3Bucket');
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (error) {
      this.available = false;
      this.logger.warn(
        `S3 bucket "${this.bucket}" is not reachable at startup. Image upload/download ` +
          `endpoints will return 503 until this is resolved. Check AWS_ENDPOINT/AWS_REGION ` +
          `and that the bucket exists (for local dev: is LocalStack running?). Cause: ${
            error instanceof Error ? error.message : String(error)
          }`,
      );
    }
  }

  // Builds a stable, collision-resistant object key. Prefixes with a
  // randomUUID() and sanitizes the filename to prevent path traversal and
  // filename collisions — matches the convention described in
  // security-rules.md for any future upload endpoint.
  buildKey(productId: string, originalFilename: string): string {
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `products/${productId}/${randomUUID()}-${sanitized}`;
  }

  // Returns the key prefix that every key issued for a given product
  // must fall under — see buildKey(). Used by callers to validate a
  // client-supplied object key is actually scoped to the product it
  // claims to belong to, before persisting it as that product's image
  // metadata (see ProductsService.addImage). Without this check, an
  // admin with product.edit on any product could attach an arbitrary
  // bucket key — including another product's image — to a different
  // product's metadata.
  keyBelongsToProduct(key: string, productId: string): boolean {
    return key.startsWith(`products/${productId}/`);
  }

  // Confirms the object actually exists in the bucket. Called before
  // persisting image metadata so a bogus or not-yet-uploaded key can't
  // be recorded as if the upload had succeeded.
  async objectExists(key: string): Promise<boolean> {
    this.assertAvailable();

    try {
      await this.s3Client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  // Returns a time-limited presigned PUT URL. The client uploads the
  // image bytes directly to S3 — this server process never buffers them.
  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS,
  ): Promise<UploadUrlResponseDto> {
    this.assertAvailable();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });

    return { uploadUrl, key, expiresInSeconds };
  }

  // Time-limited signed GET URL for displaying/downloading an image.
  // Never persist this URL — only the object key is stable; regenerate a
  // fresh signed URL on each read.
  async getSignedDownloadUrl(key: string, expiresInSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS): Promise<string> {
    this.assertAvailable();

    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    this.assertAvailable();

    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`Deleted S3 object ${key}`);
  }

  private assertAvailable(): void {
    if (!this.available) {
      throw new ServiceUnavailableException('Image storage is currently unavailable');
    }
  }
}
