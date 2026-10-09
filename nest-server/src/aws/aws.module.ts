import { Global, Module, type Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { awsConfig } from '../config/aws.config.js';
import { S3_CLIENT, S3_PRESIGNING_CLIENT } from './aws.constants.js';
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
 * Dedicated client for presigned URL generation only. When
 * s3.publicEndpoint is set (LocalStack exposed to the host, e.g. a browser
 * uploading from outside the Docker network), this client is pointed at
 * that externally-reachable endpoint instead of the internal `endpoint` —
 * so the SigV4 signature is computed against the SAME host the client
 * will actually send the request to. Rewriting the host on an
 * already-signed URL (the previous approach) breaks the signature, since
 * SigV4 signs the Host header; see aws.config.ts's s3.publicEndpoint
 * comment and S3Service.getPresignedUploadUrl/getPresignedDownloadUrl.
 *
 * When publicEndpoint is unset (production/real AWS, or a stack that
 * doesn't expose LocalStack to the host), this client is configured
 * identically to S3_CLIENT — presigned URLs behave exactly as before.
 */
const s3PresigningClientProvider: Provider = {
  provide: S3_PRESIGNING_CLIENT,
  inject: [awsConfig.KEY],
  useFactory: (config: ConfigType<typeof awsConfig>) =>
    new S3Client({
      region: config.region,
      endpoint: config.s3.publicEndpoint ?? config.endpoint,
      ...(config.credentials ? { credentials: config.credentials } : {}),
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
  providers: [
    s3ClientProvider,
    s3PresigningClientProvider,
    S3Service,
    AwsBootstrapService,
  ],
  exports: [S3Service, S3_CLIENT, S3_PRESIGNING_CLIENT],
})
export class AwsModule {}
