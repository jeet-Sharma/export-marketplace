import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

// Mock the cloudinary SDK before importing the strategy under test, since
// the strategy module imports `{ v2 as cloudinary } from 'cloudinary'` at
// the top level.
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    utils: {
      sign_request: vi.fn(),
    },
    api: {
      resource: vi.fn(),
    },
    uploader: {
      destroy: vi.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';
import type { cloudinaryConfig } from '../config/cloudinary.config.js';
import { CloudinaryStorageStrategy } from './cloudinary-storage.strategy.js';

type CloudinaryConfigType = ConfigType<typeof cloudinaryConfig>;

function createStrategy(
  config: Partial<CloudinaryConfigType> = {
    cloudName: 'demo-cloud',
    apiKey: 'demo-key',
    apiSecret: 'demo-secret',
  },
): CloudinaryStorageStrategy {
  return new CloudinaryStorageStrategy(config as CloudinaryConfigType);
}

describe('CloudinaryStorageStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureConfigured', () => {
    it('throws ServiceUnavailableException when credentials are missing', () => {
      const strategy = createStrategy({});

      expect(() => strategy.ensureConfigured()).toThrow(
        ServiceUnavailableException,
      );
      expect(cloudinary.config).not.toHaveBeenCalled();
    });

    it('configures the SDK once credentials are present, and only once', () => {
      const strategy = createStrategy();

      strategy.ensureConfigured();
      strategy.ensureConfigured();

      expect(cloudinary.config).toHaveBeenCalledTimes(1);
      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'demo-cloud',
        api_key: 'demo-key',
        api_secret: 'demo-secret',
        secure: true,
      });
    });
  });

  describe('buildProductImageKey / keyBelongsToProduct', () => {
    it('builds a products/<id>/<uuid>-<name> key without the extension', () => {
      const strategy = createStrategy();
      const key = strategy.buildProductImageKey('p1', 'photo.jpg');

      expect(key).toMatch(/^products\/p1\/[0-9a-f-]+-photo$/);
    });

    it('confirms a key belongs to its product prefix', () => {
      const strategy = createStrategy();

      expect(
        strategy.keyBelongsToProduct('products/p1/abc-photo', 'p1'),
      ).toBe(true);
      expect(
        strategy.keyBelongsToProduct('products/p2/abc-photo', 'p1'),
      ).toBe(false);
    });
  });

  describe('getPresignedUpload', () => {
    it('returns a signed Cloudinary upload target carrying the signature and public_id as fields', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.utils.sign_request).mockReturnValue({
        signature: 'sig123',
        api_key: 'demo-key',
      });

      const result = await strategy.getPresignedUpload(
        'products/p1/abc-photo',
        900,
        5 * 1024 * 1024,
        'image/jpeg',
      );

      expect(result.url).toBe(
        'https://api.cloudinary.com/v1_1/demo-cloud/image/upload',
      );
      expect(result.httpMethod).toBe('POST');
      expect(result.fields).toEqual({
        public_id: 'products/p1/abc-photo',
        timestamp: expect.any(String),
        allowed_formats: 'jpg,png,webp',
        api_key: 'demo-key',
        signature: 'sig123',
      });
    });

    it('returns its own fixed ~3600s expiry regardless of what was requested', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.utils.sign_request).mockReturnValue({
        signature: 'sig123',
        api_key: 'demo-key',
      });

      const result = await strategy.getPresignedUpload(
        'products/p1/abc-photo',
        900, // requested — must be ignored
        5 * 1024 * 1024,
        'image/jpeg',
      );

      expect(result.expiresInSeconds).toBe(3600);
    });

    it('rejects an unsupported content type before attempting to sign anything', async () => {
      const strategy = createStrategy();

      await expect(
        strategy.getPresignedUpload(
          'products/p1/abc-photo',
          900,
          5242880,
          'application/pdf',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(cloudinary.utils.sign_request).not.toHaveBeenCalled();
    });

    it('wraps signing failures in a ServiceUnavailableException', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.utils.sign_request).mockImplementation(() => {
        throw new Error('boom');
      });

      await expect(
        strategy.getPresignedUpload(
          'products/p1/abc-photo',
          900,
          5242880,
          'image/jpeg',
        ),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('getObjectMetadata', () => {
    it('returns exists:true with the byte size and detected content type when the image resource is found', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.api.resource).mockResolvedValueOnce({
        bytes: 2048,
        format: 'jpg',
      } as never);

      const result = await strategy.getObjectMetadata('products/p1/abc-photo');

      expect(cloudinary.api.resource).toHaveBeenCalledWith(
        'products/p1/abc-photo',
        { resource_type: 'image' },
      );
      expect(result).toEqual({
        exists: true,
        sizeBytes: 2048,
        detectedContentType: 'image/jpeg',
      });
    });

    it('returns detectedContentType undefined for a format outside the allowlist', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.api.resource).mockResolvedValueOnce({
        bytes: 2048,
        format: 'gif',
      } as never);

      const result = await strategy.getObjectMetadata('products/p1/abc-photo');

      expect(result).toEqual({
        exists: true,
        sizeBytes: 2048,
        detectedContentType: undefined,
      });
    });

    it('falls back to video resource type when image lookup 404s', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.api.resource)
        .mockRejectedValueOnce({ http_code: 404 })
        .mockResolvedValueOnce({ bytes: 4096, format: 'png' } as never);

      const result = await strategy.getObjectMetadata('products/p1/clip');

      expect(cloudinary.api.resource).toHaveBeenNthCalledWith(
        1,
        'products/p1/clip',
        { resource_type: 'image' },
      );
      expect(cloudinary.api.resource).toHaveBeenNthCalledWith(
        2,
        'products/p1/clip',
        { resource_type: 'video' },
      );
      expect(result).toEqual({
        exists: true,
        sizeBytes: 4096,
        detectedContentType: 'image/png',
      });
    });

    it('returns exists:false when neither resource type is found', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.api.resource).mockRejectedValue({
        http_code: 404,
      });

      const result = await strategy.getObjectMetadata('products/p1/missing');

      expect(result).toEqual({ exists: false });
    });

    it('wraps unexpected lookup failures in a ServiceUnavailableException', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.api.resource).mockRejectedValue(
        new Error('network error'),
      );

      await expect(
        strategy.getObjectMetadata('products/p1/x'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('delete', () => {
    it('deletes successfully when the image resource type matches', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.uploader.destroy).mockResolvedValueOnce({
        result: 'ok',
      } as never);

      await strategy.delete('products/p1/abc-photo');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'products/p1/abc-photo',
        { resource_type: 'image' },
      );
    });

    it('does not throw when the asset is already gone (not found)', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.uploader.destroy).mockResolvedValue({
        result: 'not found',
      } as never);

      await expect(
        strategy.delete('products/p1/missing'),
      ).resolves.toBeUndefined();
    });

    it('wraps SDK failures in a ServiceUnavailableException', async () => {
      const strategy = createStrategy();
      vi.mocked(cloudinary.uploader.destroy).mockRejectedValue(
        new Error('network error'),
      );

      await expect(strategy.delete('products/p1/x')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('getDisplayUrl', () => {
    it('builds a direct, unsigned Cloudinary delivery URL', async () => {
      const strategy = createStrategy();

      const url = await strategy.getDisplayUrl('products/p1/abc-photo');

      expect(url).toBe(
        'https://res.cloudinary.com/demo-cloud/image/upload/products/p1/abc-photo',
      );
    });

    it('ignores expiresInSeconds (Cloudinary delivery URLs do not expire)', async () => {
      const strategy = createStrategy();

      const url = await strategy.getDisplayUrl('products/p1/abc-photo', 60);

      expect(url).toBe(
        'https://res.cloudinary.com/demo-cloud/image/upload/products/p1/abc-photo',
      );
    });

    it('throws ServiceUnavailableException when credentials are missing', async () => {
      const strategy = createStrategy({});

      await expect(
        strategy.getDisplayUrl('products/p1/abc-photo'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
