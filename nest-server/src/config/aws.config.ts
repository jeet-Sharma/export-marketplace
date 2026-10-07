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
    /**
     * Host-reachable base URL for presigned S3 links used by clients outside
     * the Compose network. When set, presigned URLs are SIGNED against this
     * endpoint (not merely rewritten afterwards) so the SigV4 signature covers
     * the host a browser will actually use — valid against signature-checking
     * stores, not only permissive LocalStack.
     *
     * Sourced ONLY from AWS_S3_PUBLIC_ENDPOINT — no implicit default. When
     * unset (production/real AWS), the SDK's own endpoint is used unchanged.
     */
    publicEndpoint?: string;
  };
  sqs: {
    queueName: string;
  };
  /**
   * Whether to mount the unauthenticated /aws-demo helper routes. Read here
   * (inside the config factory, after ConfigModule has loaded .env) rather
   * than at module-import time, so a value set only in the app's .env file is
   * honored and not missed due to evaluation ordering. Requires BOTH the
   * explicit opt-in flag AND a local endpoint (never mounts against real AWS).
   */
  enableDemoRoutes: boolean;
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
    // Demo routes require explicit opt-in AND a local endpoint, so they can
    // never be mounted against real AWS even if the flag is set by mistake.
    enableDemoRoutes:
      process.env.ENABLE_AWS_DEMO_ROUTES === 'true' && isLocal,
  };
});
