import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { AwsConfig } from '../../config/aws.config.js';
import { S3_CLIENT } from '../aws/aws-clients.tokens.js';

export interface UploadFileInput {
  /** Buffer contents of the file being stored. */
  body: Buffer;
  /** Original filename, used to derive the stored key and content type. */
  fileName: string;
  contentType: string;
  /** Logical folder inside the bucket, e.g. "products", "documents". */
  folder?: string;
}

export interface UploadFileResult {
  key: string;
  bucket: string;
}

/**
 * Thin wrapper around the S3 SDK for file storage (product images, export
 * documents, certifications, etc). Callers never touch S3Client or bucket
 * names directly — everything goes through this service.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket: string;
  /**
   * False until the bucket has been confirmed reachable. Kept false (rather
   * than throwing) when S3/LocalStack is unreachable at boot, so a missing
   * LocalStack container degrades this module only, instead of crashing the
   * whole Nest app and every unrelated route with it.
   */
  private available = false;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<AwsConfig>('aws')!.s3.bucket;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucketExists();
      this.available = true;
    } catch (error) {
      this.logger.warn(
        `S3/LocalStack unreachable at startup — file storage is disabled until it is. ` +
        `Run "npm run localstack:up" and restart the API to enable it. (${(error as Error).message})`,
      );
    }
  }

  /**
   * Creates the bucket if it doesn't exist yet (always true on a fresh
   * LocalStack container; a no-op against real AWS once provisioned there).
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      this.logger.warn(`Bucket "${this.bucket}" not found, creating it`);
      await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  private assertAvailable(): void {
    if (!this.available) {
      throw new ServiceUnavailableException(
        'File storage is unavailable right now. Make sure LocalStack (dev) or AWS S3 (prod) is reachable.',
      );
    }
  }

  async uploadFile(input: UploadFileInput): Promise<UploadFileResult> {
    this.assertAvailable();
    const key = this.buildKey(input.fileName, input.folder);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    this.logger.log(`Uploaded ${key} to ${this.bucket}`);
    return { key, bucket: this.bucket };
  }

  async deleteFile(key: string): Promise<void> {
    this.assertAvailable();
    await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`Deleted ${key} from ${this.bucket}`);
  }

  /** Time-limited download URL so files can stay in a private bucket. */
  async getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    this.assertAvailable();
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }

  private buildKey(fileName: string, folder?: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePrefix = randomUUID();
    return folder ? `${folder}/${uniquePrefix}-${safeName}` : `${uniquePrefix}-${safeName}`;
  }
}
