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
 * The demo controller exposes UNAUTHENTICATED S3/SQS routes (read, upload,
 * delete). It is a local verification helper and must never be mounted in a
 * deployed environment, where those routes would be reachable by anyone who
 * can hit the published API port and could operate on real AWS.
 *
 * It is therefore OFF by default and only registered when the demo routes are
 * explicitly enabled (ENABLE_AWS_DEMO_ROUTES=true) AND the app is pointed at a
 * local endpoint (AWS_ENDPOINT set, i.e. LocalStack). Both conditions must
 * hold, so a stray env var alone cannot expose the routes in production.
 */
const demoRoutesEnabled =
  process.env.ENABLE_AWS_DEMO_ROUTES === 'true' &&
  Boolean(process.env.AWS_ENDPOINT?.trim());
const demoControllers = demoRoutesEnabled ? [AwsDemoController] : [];

/**
 * Global module exposing configured S3 and SQS clients plus their services.
 * Marked @Global so S3Service and SqsService can be injected anywhere without
 * re-importing AwsModule in every feature module.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  controllers: [...demoControllers],
  providers: [
    s3ClientProvider,
    sqsClientProvider,
    S3Service,
    SqsService,
    AwsBootstrapService,
  ],
  exports: [S3Service, SqsService, S3_CLIENT, SQS_CLIENT],
})
export class AwsModule { }
