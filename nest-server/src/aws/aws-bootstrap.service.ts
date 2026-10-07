import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { CreateQueueCommand, SQSClient } from '@aws-sdk/client-sqs';
import { awsConfig } from '../config/aws.config.js';
import { S3_CLIENT, SQS_CLIENT } from './aws.constants.js';

/**
 * Ensures the S3 bucket and SQS queue exist when the app starts.
 *
 * This only runs against LocalStack (isLocal === true). In production the
 * bucket and queue are expected to be provisioned by infrastructure-as-code,
 * and the app should not attempt to create them.
 */
@Injectable()
export class AwsBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AwsBootstrapService.name);

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    @Inject(SQS_CLIENT) private readonly sqs: SQSClient,
    @Inject(awsConfig.KEY) private readonly config: ConfigType<typeof awsConfig>,
  ) { }

  /** Max attempts for each resource before giving up. */
  private static readonly MAX_ATTEMPTS = 10;
  /** Base delay between attempts; grows linearly per attempt. */
  private static readonly RETRY_BASE_MS = 1000;

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.isLocal) {
      this.logger.log(
        'Non-local environment detected; skipping LocalStack resource bootstrap.',
      );
      return;
    }

    await this.ensureBucket();
    await this.ensureQueue();
  }

  /**
   * Retries an idempotent operation until it succeeds or attempts are
   * exhausted. Protects startup against LocalStack not being fully ready yet,
   * so the bucket/queue are reliably created instead of silently skipped.
   */
  private async withRetries<T>(
    label: string,
    operation: () => Promise<T>,
  ): Promise<T | undefined> {
    for (let attempt = 1; attempt <= AwsBootstrapService.MAX_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const message = (error as Error).message;
        if (attempt === AwsBootstrapService.MAX_ATTEMPTS) {
          this.logger.error(
            `${label} failed after ${attempt} attempts: ${message}`,
          );
          return undefined;
        }
        const delayMs = AwsBootstrapService.RETRY_BASE_MS * attempt;
        this.logger.warn(
          `${label} attempt ${attempt} failed (${message}); retrying in ${delayMs}ms.`,
        );
        await this.sleep(delayMs);
      }
    }
    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async ensureBucket(): Promise<void> {
    const bucket = this.config.s3.bucket;
    await this.withRetries(`Ensure S3 bucket "${bucket}"`, async () => {
      try {
        await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
        this.logger.log(`S3 bucket "${bucket}" already exists.`);
        return;
      } catch (error) {
        // A 404/NotFound means the bucket is absent and should be created.
        // Any other error (e.g. LocalStack not ready) propagates so the
        // operation is retried rather than treated as "needs creating".
        if (!this.isNotFound(error)) {
          throw error;
        }
      }
      await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
      this.logger.log(`Created S3 bucket "${bucket}".`);
    });
  }

  private async ensureQueue(): Promise<void> {
    const queueName = this.config.sqs.queueName;
    await this.withRetries(`Ensure SQS queue "${queueName}"`, async () => {
      // CreateQueue is idempotent: if the queue already exists with the same
      // attributes, SQS returns the existing queue URL without error.
      const result = await this.sqs.send(
        new CreateQueueCommand({ QueueName: queueName }),
      );
      this.logger.log(`SQS queue ready: ${result.QueueUrl}`);
    });
  }

  /** True when an error indicates the bucket does not exist (vs. not ready). */
  private isNotFound(error: unknown): boolean {
    const name = (error as { name?: string })?.name;
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    return name === 'NotFound' || name === 'NoSuchBucket' || status === 404;
  }
}
