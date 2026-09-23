import { registerAs } from '@nestjs/config';

export interface AwsConfig {
  region: string;
  /** LocalStack edge endpoint in dev; undefined so the SDK targets real AWS in prod. */
  endpoint: string | undefined;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  s3: {
    bucket: string;
  };
  sqs: {
    queueName: string;
  };
}

/**
 * AWS / LocalStack configuration, namespaced under "aws" in the Nest
 * ConfigService. Reads directly from process.env because this factory runs
 * once at module init, before any request-scoped context exists.
 */
export default registerAs('aws', (): AwsConfig => {
  return {
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET ?? 'export-marketplace-documents',
    },
    sqs: {
      queueName: process.env.AWS_SQS_QUEUE_NAME ?? 'export-marketplace-events',
    },
  };
});
