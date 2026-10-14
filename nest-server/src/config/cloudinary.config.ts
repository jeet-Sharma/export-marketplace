import { registerAs } from '@nestjs/config';

/**
 * Typed Cloudinary configuration, loaded from environment variables.
 * Follows the same `registerAs` pattern as aws.config.ts. Only read/
 * validated when STORAGE_PROVIDER=cloudinary — see storage.module.ts,
 * which is where the fail-fast credential check happens (not here: a
 * config factory should stay side-effect-free and must still load
 * cleanly when Cloudinary isn't the active provider, e.g. in CI/tests
 * that only exercise the S3 strategy).
 */
export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

export const cloudinaryConfig = registerAs(
  'cloudinary',
  (): CloudinaryConfig => ({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() || undefined,
    apiKey: process.env.CLOUDINARY_API_KEY?.trim() || undefined,
    apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() || undefined,
  }),
);
