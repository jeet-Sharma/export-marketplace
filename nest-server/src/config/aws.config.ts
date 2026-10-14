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
 * `s3.publicEndpoint`) and exports via a named `awsConfig` (registerAs's
 * own ConfigType pattern) instead of a default export, matching every
 * other AWS-consuming file (AwsModule, S3Service, AwsBootstrapService).
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
  /**
   * Gates the unauthenticated /aws-demo helper routes (see AwsDemoGuard).
   * True only when ENABLE_AWS_DEMO_ROUTES=true AND a local endpoint
   * (AWS_ENDPOINT) is configured, so the flag alone can't expose the routes
   * against real AWS/production.
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
      // Host-reachable base URL used to SIGN presigned URLs that go to an
      // external client (browser), instead of signing against `endpoint`
      // (e.g. http://localstack:4566, which only resolves inside Docker)
      // and rewriting the host afterward. A post-signing host rewrite is
      // NOT safe: AWS SigV4 includes the Host in the signed canonical
      // request, so swapping the host string after signing invalidates the
      // signature and the client's PUT/GET gets rejected with
      // SignatureDoesNotMatch (see S3Service's presigned-URL client,
      // which is constructed with THIS endpoint rather than `endpoint`).
      //
      // Sourced ONLY from AWS_S3_PUBLIC_ENDPOINT — there is no implicit
      // default, so presigned URLs use the same client/endpoint as every
      // other S3 call unless an operator explicitly opts in with a known
      // host-reachable address.
      publicEndpoint: process.env.AWS_S3_PUBLIC_ENDPOINT?.trim() || undefined,
    },
    enableDemoRoutes: process.env.ENABLE_AWS_DEMO_ROUTES === 'true' && isLocal,
  };
});
