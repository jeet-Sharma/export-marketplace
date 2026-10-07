import { registerAs } from '@nestjs/config';

// Namespaced AWS config. AWS_ENDPOINT is left empty in production so the
// SDK talks to real AWS; set it to the LocalStack endpoint for local dev
// (see .env). AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY default to
// LocalStack's accepted dummy values ('test'/'test') — never put real AWS
// credentials in this file's defaults.
export default registerAs('aws', () => ({
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'test',
  s3Bucket: process.env.AWS_S3_BUCKET ?? 'export-marketplace-documents',
}));
