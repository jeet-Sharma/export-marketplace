import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
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
  /**
   * Separate client used only for presigning, bound to the public endpoint
   * when one is configured. Built lazily and cached. See getSigningClient().
   */
  private signingClient?: S3Client;

  constructor(
    @Inject(S3_CLIENT) private readonly client: S3Client,
    @Inject(awsConfig.KEY) private readonly config: ConfigType<typeof awsConfig>,
  ) {
    this.bucket = this.config.s3.bucket;
  }

  /**
   * Returns the client to presign with. When AWS_S3_PUBLIC_ENDPOINT is set,
   * presign against a client bound to that endpoint so the SigV4 signature
   * covers the host the browser will actually use — a rewrite-after-signing
   * approach only works on permissive stores (LocalStack) and is rejected by
   * signature-validating ones (MinIO, real S3). When unset, the normal client
   * is used and its own endpoint is signed, which is already host-reachable.
   */
  private getSigningClient(): S3Client {
    const publicEndpoint = this.config.s3.publicEndpoint;
    if (!publicEndpoint) {
      return this.client;
    }
    if (!this.signingClient) {
      this.signingClient = new S3Client({
        region: this.config.region,
        endpoint: publicEndpoint,
        forcePathStyle: this.config.s3.forcePathStyle,
        ...(this.config.credentials
          ? { credentials: this.config.credentials }
          : {}),
      });
    }
    return this.signingClient;
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
    // Sign with the public-endpoint client so the signature is valid for the
    // host the client will actually request (see getSigningClient).
    return getSignedUrl(this.getSigningClient(), command, {
      expiresIn: expiresInSeconds,
    });
  }

  /** Generates a time-limited presigned URL for uploading an object directly. */
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
    return getSignedUrl(this.getSigningClient(), command, {
      expiresIn: expiresInSeconds,
    });
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
