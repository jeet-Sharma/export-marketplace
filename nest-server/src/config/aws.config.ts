import { registerAs } from '@nestjs/config';

/**
 * Typed AWS configuration, loaded from environment variables.
 *
 * When AWS_ENDPOINT is set (local development with LocalStack) the SDK is
 * pointed at that endpoint and path-style addressing is forced, which is what
 * LocalStack's S3 expects. In production AWS_ENDPOINT is left empty so the SDK
 * talks to the real AWS endpoints using the default credential chain.
 */
export interface AwsConfig {
  region: string;
  /** Custom endpoint for LocalStack. Empty/undefined means real AWS. */
  endpoint?: string;
  /** True when a custom endpoint is configured (i.e. running against LocalStack). */
  isLocal: boolean;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  s3: {
    bucket: string;
    /** LocalStack S3 requires path-style URLs (http://host:4566/bucket/key). */
    forcePathStyle: boolean;
  };
  sqs: {
    queueName: string;
  };
}

export const awsConfig = registerAs('aws', (): AwsConfig => {
  const endpoint = process.env.AWS_ENDPOINT?.trim() || undefined;
  const isLocal = Boolean(endpoint);

  return {
    region: process.env.AWS_REGION ?? 'us-east-1',
    endpoint,
    isLocal,
    // Only pass static credentials when running locally. In production, leave
    // them undefined so the default provider chain (IAM role, env, etc.) applies.
    credentials: isLocal
      ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
      }
      : undefined,
    s3: {
      bucket: process.env.AWS_S3_BUCKET ?? 'export-marketplace-documents',
      forcePathStyle: isLocal,
    },
    sqs: {
      queueName: process.env.AWS_SQS_QUEUE_NAME ?? 'export-marketplace-events',
    },
  };
});
