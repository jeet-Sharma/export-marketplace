import { Global, Module, type Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { cloudinaryConfig } from '../config/cloudinary.config.js';
import { CloudinaryStorageStrategy } from './cloudinary-storage.strategy.js';
import { S3StorageStrategy } from './s3-storage.strategy.js';
import {
  STORAGE_PROVIDERS,
  STORAGE_STRATEGY,
  type StorageProvider,
} from './storage-strategy.interface.js';

/**
 * Reads STORAGE_PROVIDER directly (not through a registerAs config factory)
 * because it's a structural switch deciding *which provider's config to
 * load*, not a value belonging to either provider's own config namespace —
 * same reasoning as AwsModule's `demoRoutesEnabled` check in aws.module.ts.
 */
// Exported for direct unit testing (storage.module.spec.ts) without needing
// to spin up a full Nest TestingModule just to exercise this selection logic.
export function resolveStorageProvider(): StorageProvider {
  const raw = process.env.STORAGE_PROVIDER?.trim() || 's3';
  if (!STORAGE_PROVIDERS.includes(raw as StorageProvider)) {
    throw new Error(
      `Unsupported STORAGE_PROVIDER "${raw}". Supported values: ${STORAGE_PROVIDERS.join(', ')}.`,
    );
  }
  return raw as StorageProvider;
}

// Exported for the same reason as resolveStorageProvider above.
export function selectStorageStrategy(
  s3Strategy: S3StorageStrategy,
  cloudinaryStrategy: CloudinaryStorageStrategy,
) {
  const provider = resolveStorageProvider();
  switch (provider) {
    case 's3':
      return s3Strategy;
    case 'cloudinary':
      // Validate Cloudinary credentials now (app startup / module init),
      // not on the first upload request — see
      // CloudinaryStorageStrategy.ensureConfigured's "fail fast" note.
      cloudinaryStrategy.ensureConfigured();
      return cloudinaryStrategy;
  }
}

const storageStrategyProvider: Provider = {
  provide: STORAGE_STRATEGY,
  inject: [S3StorageStrategy, CloudinaryStorageStrategy],
  useFactory: selectStorageStrategy,
};

/**
 * Global module exposing the active StorageStrategy behind the
 * STORAGE_STRATEGY token. Business services (ProductsService) inject that
 * token instead of depending on S3Service or CloudinaryStorageStrategy
 * directly — switching STORAGE_PROVIDER changes which concrete strategy is
 * bound, with no changes required in any consumer.
 *
 * Both concrete strategies are always instantiated — S3StorageStrategy is
 * cheap (it only wraps the already-global S3Service), and
 * CloudinaryStorageStrategy defers credential validation until this factory
 * explicitly calls `ensureConfigured()`, which only happens when
 * STORAGE_PROVIDER=cloudinary. This way an unsupported/misconfigured
 * provider fails fast at startup (resolveStorageProvider's throw, or
 * ensureConfigured's throw, both run during Nest's module
 * instantiation — before the app starts accepting requests) while
 * STORAGE_PROVIDER=s3 is completely unaffected by Cloudinary env vars being
 * absent, which is the normal case for local/production.
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(cloudinaryConfig)],
  providers: [
    S3StorageStrategy,
    CloudinaryStorageStrategy,
    storageStrategyProvider,
  ],
  exports: [STORAGE_STRATEGY],
})
export class StorageModule {}
