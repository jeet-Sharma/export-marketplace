import { resolveStorageProvider, selectStorageStrategy } from './storage.module.js';
import { S3StorageStrategy } from './s3-storage.strategy.js';
import { CloudinaryStorageStrategy } from './cloudinary-storage.strategy.js';

// Tests the STORAGE_PROVIDER selection logic in isolation. Full DI wiring
// (ConfigModule.forFeature, @Global, etc.) is exercised implicitly by the
// app booting successfully (see app build/e2e) — this focuses purely on
// "given STORAGE_PROVIDER=X, which strategy comes back / does it fail fast".
describe('storage.module strategy selection', () => {
  const originalEnv = process.env.STORAGE_PROVIDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.STORAGE_PROVIDER;
    } else {
      process.env.STORAGE_PROVIDER = originalEnv;
    }
  });

  describe('resolveStorageProvider', () => {
    it('defaults to "s3" when STORAGE_PROVIDER is unset', () => {
      delete process.env.STORAGE_PROVIDER;
      expect(resolveStorageProvider()).toBe('s3');
    });

    it('returns "cloudinary" when explicitly configured', () => {
      process.env.STORAGE_PROVIDER = 'cloudinary';
      expect(resolveStorageProvider()).toBe('cloudinary');
    });

    it('throws a clear error for an unsupported provider value', () => {
      process.env.STORAGE_PROVIDER = 'azure-blob';
      expect(() => resolveStorageProvider()).toThrow(
        /Unsupported STORAGE_PROVIDER "azure-blob"/,
      );
    });
  });

  describe('selectStorageStrategy', () => {
    function createStrategies() {
      const s3Strategy = Object.create(
        S3StorageStrategy.prototype,
      ) as S3StorageStrategy;
      const cloudinaryStrategy = {
        ensureConfigured: vi.fn(),
      } as unknown as CloudinaryStorageStrategy;
      return { s3Strategy, cloudinaryStrategy };
    }

    it('selects the S3 strategy and skips Cloudinary validation when STORAGE_PROVIDER=s3', () => {
      process.env.STORAGE_PROVIDER = 's3';
      const { s3Strategy, cloudinaryStrategy } = createStrategies();

      const selected = selectStorageStrategy(s3Strategy, cloudinaryStrategy);

      expect(selected).toBe(s3Strategy);
      expect(cloudinaryStrategy.ensureConfigured).not.toHaveBeenCalled();
    });

    it('selects the Cloudinary strategy and validates its credentials when STORAGE_PROVIDER=cloudinary', () => {
      process.env.STORAGE_PROVIDER = 'cloudinary';
      const { s3Strategy, cloudinaryStrategy } = createStrategies();

      const selected = selectStorageStrategy(s3Strategy, cloudinaryStrategy);

      expect(selected).toBe(cloudinaryStrategy);
      expect(cloudinaryStrategy.ensureConfigured).toHaveBeenCalledTimes(1);
    });

    it('propagates a credential validation failure instead of silently falling back', () => {
      process.env.STORAGE_PROVIDER = 'cloudinary';
      const { s3Strategy, cloudinaryStrategy } = createStrategies();
      vi.mocked(cloudinaryStrategy.ensureConfigured).mockImplementation(() => {
        throw new Error('missing credentials');
      });

      expect(() =>
        selectStorageStrategy(s3Strategy, cloudinaryStrategy),
      ).toThrow('missing credentials');
    });

    it('rejects an unsupported provider rather than defaulting to a strategy', () => {
      process.env.STORAGE_PROVIDER = 'unsupported';
      const { s3Strategy, cloudinaryStrategy } = createStrategies();

      expect(() =>
        selectStorageStrategy(s3Strategy, cloudinaryStrategy),
      ).toThrow(/Unsupported STORAGE_PROVIDER/);
    });
  });
});
