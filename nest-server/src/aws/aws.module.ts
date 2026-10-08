import { Global, Module, type Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { awsConfig } from '../config/aws.config.js';
import { S3_CLIENT } from './aws.constants.js';
import { S3Service } from './s3.service.js';
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

/**
 * The demo controller exposes UNAUTHENTICATED S3 routes (read, upload,
 * delete). It is a local verification helper and must never be mounted in a
 * deployed environment, where those routes would be reachable by anyone able
 * to hit the published API port.
 *
 * It is OFF by default and only registered when the demo routes are explicitly
 * enabled (ENABLE_AWS_DEMO_ROUTES=true) AND the app is pointed at a local
 * endpoint (AWS_ENDPOINT set, i.e. LocalStack). Both conditions must hold, so a
 * stray env var alone cannot expose the routes in production.
 */
const demoRoutesEnabled =
  process.env.ENABLE_AWS_DEMO_ROUTES === 'true' &&
  Boolean(process.env.AWS_ENDPOINT?.trim());
const demoControllers = demoRoutesEnabled ? [AwsDemoController] : [];

/**
 * Global module exposing a configured S3 client plus its service. Marked
 * @Global so S3Service can be injected anywhere without re-importing
 * AwsModule in every feature module.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(awsConfig)],
  controllers: [...demoControllers],
  providers: [s3ClientProvider, S3Service, AwsBootstrapService],
  exports: [S3Service, S3_CLIENT],
})
export class AwsModule {}
