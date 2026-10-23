import type { ConfigType } from '@nestjs/config';

// Mock both presigning SDK modules before importing S3Service, since it
// imports them at the top level.
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));
vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: vi.fn(),
}));

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import type { S3Client } from '@aws-sdk/client-s3';
import type { awsConfig } from '../config/aws.config.js';
import { S3Service } from './s3.service.js';

type AwsConfigType = ConfigType<typeof awsConfig>;

function createConfig(overrides: Partial<AwsConfigType> = {}): AwsConfigType {
  return {
    region: 'us-east-1',
    isLocal: false,
    s3: {
      bucket: 'test-bucket',
      forcePathStyle: false,
    },
    ...overrides,
  } as AwsConfigType;
}

describe('S3Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createService(config: AwsConfigType = createConfig()) {
    const client = {} as S3Client;
    const presigningClient = {} as S3Client;
    const service = new S3Service(client, presigningClient, config);
    return { service, client, presigningClient };
  }

  describe('getPresignedUploadPost', () => {
    it('enforces maxSizeBytes via a content-length-range condition', async () => {
      vi.mocked(createPresignedPost).mockResolvedValue({
        url: 'https://bucket.s3.example.com/',
        fields: { key: 'products/p1/x.jpg' },
      });
      const { service, presigningClient } = createService();

      const result = await service.getPresignedUploadPost(
        'products/p1/x.jpg',
        900,
        5 * 1024 * 1024,
        'image/jpeg',
      );

      expect(createPresignedPost).toHaveBeenCalledWith(
        presigningClient,
        expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'products/p1/x.jpg',
          Expires: 900,
          Conditions: expect.arrayContaining([
            ['content-length-range', 1, 5 * 1024 * 1024],
          ]),
          Fields: { 'Content-Type': 'image/jpeg' },
        }),
      );
      expect(result).toEqual({
        url: 'https://bucket.s3.example.com/',
        fields: { key: 'products/p1/x.jpg' },
      });
    });

    it('signs against the presigning client, not the internal client', async () => {
      vi.mocked(createPresignedPost).mockResolvedValue({
        url: 'https://public.example.com/',
        fields: {},
      });
      const { service, presigningClient } = createService();

      await service.getPresignedUploadPost('products/p1/x.jpg', 900, 1024);

      expect(createPresignedPost).toHaveBeenCalledWith(
        presigningClient,
        expect.anything(),
      );
    });

    it('omits the Content-Type condition/field when no content type is given', async () => {
      vi.mocked(createPresignedPost).mockResolvedValue({
        url: 'https://bucket.s3.example.com/',
        fields: {},
      });
      const { service } = createService();

      await service.getPresignedUploadPost('products/p1/x.jpg', 900, 1024);

      expect(createPresignedPost).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Conditions: [['content-length-range', 1, 1024]],
          Fields: undefined,
        }),
      );
    });
  });

  describe('getPresignedDownloadUrl / getPresignedUploadPost use the presigning client', () => {
    it('getPresignedDownloadUrl signs with the presigning client and returns the URL unmodified', async () => {
      vi.mocked(getSignedUrl).mockResolvedValue('https://signed.example/get');
      const { service, presigningClient } = createService();

      const url = await service.getPresignedDownloadUrl('products/p1/x.jpg');

      expect(getSignedUrl).toHaveBeenCalledWith(
        presigningClient,
        expect.anything(),
        { expiresIn: 900 },
      );
      expect(url).toBe('https://signed.example/get');
    });
  });
});
