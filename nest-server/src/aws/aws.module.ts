import { Global, Module, type Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { awsConfig } from '../config/aws.config.js';
import { S3_CLIENT, SQS_CLIENT } from './aws.constants.js';
import { S3Service } from './s3.service.js';
import { SqsService } from './sqs.service.js';
import { AwsBootstrapService } from './aws-bootstrap.service.js';
import { AwsDemoController } from './aws-demo.controller.js';
import { AwsDemoGuard } from './aws-demo.guard.js';

/**
 * Builds the common client options shared by every AWS SDK client.
 * `endpoint` and static `credentials` are only present when running locally
 * against LocalStack (see aws.config.ts).
 */
function baseClientConfig(config: ConfigType<typeof awsConfig>) {
  return {
    region: config.region,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    ...(config.credentials ? { credentials: config.credentials } : {}),
  };
}

const s3ClientProvider: Provider = {
  provide: S3_CLIENT,
  inject: [awsConfig.KEY],
  useFactory: (config: ConfigType<typeof awsConfig>) =>
    new S3Client({
      ...baseClientConfig(config),
      // LocalStack S3 requires path-style addressing.
      forcePathStyle: config.s3.forcePathStyle,
    }),
};

const sqsClientProvider: Provider = {
  provide: SQS_CLIENT,
  inject: [awsConfig.KEY],
  useFactory: (config: ConfigType<typeof awsConfig>) =>
    new SQSClient(baseClientConfig(config)),
};

/**
 * Global module exposing configured S3 and SQS clients plus their services.
 * Marked @Global so S3Service and SqsService can be injected anywhere without
 * re-importing AwsModule in every feature module.
 *
 * The demo controller is always registered but every route is gated by
 * AwsDemoGuard, which reads the loaded config (ConfigService) at request time.
 * This replaces the previous import-time `process.env` check, which ran before
 * ConfigModule loaded the app's .env and could leave the routes unregistered
 * even when enabled there.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  controllers: [AwsDemoController],
  providers: [
    s3ClientProvider,
    sqsClientProvider,
    S3Service,
    SqsService,
    AwsBootstrapService,
    AwsDemoGuard,
  ],
  exports: [S3Service, SqsService, S3_CLIENT, SQS_CLIENT],
})
export class AwsModule { }
