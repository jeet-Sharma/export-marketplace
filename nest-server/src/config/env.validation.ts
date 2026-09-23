/**
 * Fails fast on boot if required environment variables are missing, rather
 * than letting the AWS SDK throw a cryptic error on the first S3/SQS call.
 * Kept dependency-free (no Joi/Zod) since this project has no schema
 * validation library installed yet.
 */
const REQUIRED_ENV_VARS = ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_SQS_QUEUE_NAME'] as const;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the values.',
    );
  }

  return config;
}
