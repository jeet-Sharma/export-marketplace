import { registerAs } from '@nestjs/config';

/**
 * Typed AWS configuration, loaded from environment variables.
 *
 * This supersedes an earlier, simpler shape (flat region/endpoint/
 * accessKeyId/secretAccessKey/s3Bucket strings with a `default` export)
 * that existed before this file was merged with dev-version01's Docker
 * work. Every value that shape read is still read here — region,
 * endpoint, accessKeyId/secretAccessKey (now under `credentials`), and
 * s3Bucket (now `s3.bucket`) — this version just adds the fields the
 * Docker/LocalStack integration needs (`isLocal`, `s3.forcePathStyle`,
 * `s3.publicEndpoint`, `sqs.queueName`) and exports via a named
 * `awsConfig` (registerAs's own ConfigType pattern) instead of a default
 * export, matching every other AWS-consuming file (AwsModule, S3Service,
 * SqsService, AwsBootstrapService).
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
    /**
     * Host-reachable base URL used to rewrite presigned URLs for clients
     * outside the Compose network. The SDK signs URLs against `endpoint`
     * (e.g. http://localstack:4566), which only resolves inside Docker; this
     * value replaces that host so a user's browser can open the link.
     *
     * Sourced ONLY from AWS_S3_PUBLIC_ENDPOINT — there is no implicit default,
     * so URLs are left untouched unless an operator explicitly opts in with a
     * known host-reachable address.
     */
    publicEndpoint?: string;
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
      // Only rewrite presigned URL hosts when AWS_S3_PUBLIC_ENDPOINT is set
      // EXPLICITLY. There is deliberately no hardcoded fallback: guessing
      // "http://localhost:4566" would produce links that are wrong whenever the
      // published port differs or the stack runs on a remote host. When unset
      // (production/real AWS, or a stack that doesn't expose LocalStack to the
      // host), the SDK's signed URL is returned unchanged.
      publicEndpoint: process.env.AWS_S3_PUBLIC_ENDPOINT?.trim() || undefined,
    },
    sqs: {
      queueName: process.env.AWS_SQS_QUEUE_NAME ?? 'export-marketplace-events',
    },
  };
});
