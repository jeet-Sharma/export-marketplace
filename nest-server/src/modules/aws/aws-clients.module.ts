import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3_CLIENT } from './aws-clients.tokens.js';

// Shared AWS SDK v3 clients, provided behind DI tokens so services depend
// on an interface-shaped token rather than instantiating SDK clients
// inline. Add new clients (e.g. SQS) here following the same pattern if a
// future module needs one.
@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        new S3Client({
          region: configService.getOrThrow<string>('aws.region'),
          endpoint: configService.get<string>('aws.endpoint'),
          // LocalStack's S3 emulation requires path-style addressing;
          // real AWS defaults to virtual-hosted-style regardless of this
          // flag, so it's safe to always set it rather than branching on
          // environment.
          forcePathStyle: true,
          credentials: {
            accessKeyId: configService.getOrThrow<string>('aws.accessKeyId'),
            secretAccessKey: configService.getOrThrow<string>('aws.secretAccessKey'),
          },
        }),
    },
  ],
  exports: [S3_CLIENT],
})
export class AwsClientsModule {}
