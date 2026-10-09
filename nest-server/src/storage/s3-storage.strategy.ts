import { Injectable } from '@nestjs/common';
import { S3Service } from '../aws/s3.service.js';
import type {
  PresignedUpload,
  StorageObjectMetadata,
  StorageStrategy,
} from './storage-strategy.interface.js';

/**
 * Delegates every call straight through to the existing S3Service — no
 * behavior change, no rewrite. This class exists only so ProductsService can
 * depend on the StorageStrategy abstraction instead of the concrete S3Service
 * class. S3Service itself (LocalStack/AWS client config, presigned URL
 * generation, bucket, etc.) is untouched.
 */
@Injectable()
export class S3StorageStrategy implements StorageStrategy {
  constructor(private readonly s3Service: S3Service) {}

  buildProductImageKey(productId: string, originalFilename: string): string {
    return this.s3Service.buildProductImageKey(productId, originalFilename);
  }

  keyBelongsToProduct(key: string, productId: string): boolean {
    return this.s3Service.keyBelongsToProduct(key, productId);
  }

  async getPresignedUpload(
    key: string,
    expiresInSeconds: number,
    maxSizeBytes: number,
    contentType?: string,
  ): Promise<PresignedUpload> {
    const { url, fields } = await this.s3Service.getPresignedUploadPost(
      key,
      expiresInSeconds,
      maxSizeBytes,
      contentType,
    );
    // S3's POST policy `Expires` is fully caller-controlled, so the actual
    // expiry equals exactly what was requested — see PresignedUpload's
    // `expiresInSeconds` doc comment (Qodo review Bug #11).
    return { url, httpMethod: 'POST', fields, expiresInSeconds };
  }

  async getObjectMetadata(key: string): Promise<StorageObjectMetadata> {
    return this.s3Service.getObjectMetadata(key);
  }

  async delete(key: string): Promise<void> {
    await this.s3Service.delete(key);
  }

  async getDisplayUrl(key: string, expiresInSeconds?: number): Promise<string> {
    // Passing `undefined` through explicitly still triggers
    // getPresignedDownloadUrl's own default parameter (JS treats an
    // undefined argument as "not provided"), so no extra default is
    // needed here.
    return this.s3Service.getPresignedDownloadUrl(key, expiresInSeconds);
  }
}
