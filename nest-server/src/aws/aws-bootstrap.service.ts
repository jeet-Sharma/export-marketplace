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

  private async ensureBucket(): Promise<void> {
    const bucket = this.config.s3.bucket;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`S3 bucket "${bucket}" already exists.`);
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Created S3 bucket "${bucket}".`);
      } catch (error) {
        this.logger.error(
          `Failed to create S3 bucket "${bucket}": ${(error as Error).message}`,
        );
      }
    }
  }

  private async ensureQueue(): Promise<void> {
    const queueName = this.config.sqs.queueName;
    try {
      // CreateQueue is idempotent: if the queue already exists with the same
      // attributes, SQS returns the existing queue URL without error.
      const result = await this.sqs.send(
        new CreateQueueCommand({ QueueName: queueName }),
      );
      this.logger.log(`SQS queue ready: ${result.QueueUrl}`);
    } catch (error) {
      this.logger.error(
        `Failed to create SQS queue "${queueName}": ${(error as Error).message}`,
      );
    }
  }
}
