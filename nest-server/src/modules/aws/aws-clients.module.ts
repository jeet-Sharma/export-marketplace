import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import type { AwsConfig } from '../../config/aws.config.js';
import { S3_CLIENT, SQS_CLIENT } from './aws-clients.tokens.js';

// Only applied when AWS_ENDPOINT is set (LocalStack/dev). Against real AWS
// (AWS_ENDPOINT unset) the SDK's normal timeouts/retries are used instead,
// since a slower real network shouldn't be treated as "unreachable".
const LOCALSTACK_CONNECTION_TIMEOUT_MS = 1_500;
const LOCALSTACK_MAX_ATTEMPTS = 2;

/**
 * Provides the shared AWS SDK v3 clients used across the app. Both clients
 * point at the LocalStack edge endpoint in development (AWS_ENDPOINT set)
 * and at real AWS in production (AWS_ENDPOINT unset), so no code outside
 * this module needs to know which environment it is running in.
 *
 * When targeting LocalStack, connection/retry timeouts are kept short so
 * that a missing "npm run localstack:up" fails fast at app boot (a couple
 * of seconds) instead of hanging on the SDK's default retry backoff.
 */
@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const aws = configService.get<AwsConfig>('aws')!;
        return new S3Client({
          region: aws.region,
          endpoint: aws.endpoint,
          credentials: aws.credentials,
          // LocalStack (and most non-AWS S3 endpoints) require path-style
          // bucket addressing instead of virtual-hosted-style.
          forcePathStyle: Boolean(aws.endpoint),
          ...(aws.endpoint && {
            maxAttempts: LOCALSTACK_MAX_ATTEMPTS,
            requestHandler: new NodeHttpHandler({
              connectionTimeout: LOCALSTACK_CONNECTION_TIMEOUT_MS,
              requestTimeout: LOCALSTACK_CONNECTION_TIMEOUT_MS,
            }),
          }),
        });
      },
    },
    {
      provide: SQS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const aws = configService.get<AwsConfig>('aws')!;
        return new SQSClient({
          region: aws.region,
          endpoint: aws.endpoint,
          credentials: aws.credentials,
          ...(aws.endpoint && {
            maxAttempts: LOCALSTACK_MAX_ATTEMPTS,
            requestHandler: new NodeHttpHandler({
              connectionTimeout: LOCALSTACK_CONNECTION_TIMEOUT_MS,
              requestTimeout: LOCALSTACK_CONNECTION_TIMEOUT_MS,
            }),
          }),
        });
      },
    },
  ],
  exports: [S3_CLIENT, SQS_CLIENT],
})
export class AwsClientsModule { }
