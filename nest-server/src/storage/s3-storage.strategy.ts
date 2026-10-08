import { Injectable } from '@nestjs/common';
import { S3Service } from '../aws/s3.service.js';
import type {
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

  async getPresignedUploadUrl(
    key: string,
    expiresInSeconds: number,
    contentType?: string,
  ): Promise<string> {
    return this.s3Service.getPresignedUploadUrl(
      key,
      expiresInSeconds,
      contentType,
    );
  }

  async getObjectMetadata(key: string): Promise<StorageObjectMetadata> {
    return this.s3Service.getObjectMetadata(key);
  }

  async delete(key: string): Promise<void> {
    await this.s3Service.delete(key);
  }
}
