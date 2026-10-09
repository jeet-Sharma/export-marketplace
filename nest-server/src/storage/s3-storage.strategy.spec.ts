import { S3StorageStrategy } from './s3-storage.strategy.js';
import type { S3Service } from '../aws/s3.service.js';

// Verifies S3StorageStrategy is a pure delegate to S3Service — i.e. the
// existing S3/LocalStack behavior is preserved unchanged behind the new
// StorageStrategy abstraction. Mocks S3Service itself (not the AWS SDK),
// since S3Service already has its own responsibility for talking to the
// client; this test only needs to prove delegation, not S3 behavior.
describe('S3StorageStrategy', () => {
  function createMockS3Service(): S3Service {
    return {
      buildProductImageKey: vi.fn(),
      keyBelongsToProduct: vi.fn(),
      getPresignedUploadPost: vi.fn(),
      getObjectMetadata: vi.fn(),
      delete: vi.fn(),
    } as unknown as S3Service;
  }

  it('delegates buildProductImageKey to S3Service', () => {
    const s3Service = createMockS3Service();
    vi.mocked(s3Service.buildProductImageKey).mockReturnValue(
      'products/p1/uuid-file.jpg',
    );
    const strategy = new S3StorageStrategy(s3Service);

    const result = strategy.buildProductImageKey('p1', 'file.jpg');

    expect(s3Service.buildProductImageKey).toHaveBeenCalledWith(
      'p1',
      'file.jpg',
    );
    expect(result).toBe('products/p1/uuid-file.jpg');
  });

  it('delegates keyBelongsToProduct to S3Service', () => {
    const s3Service = createMockS3Service();
    vi.mocked(s3Service.keyBelongsToProduct).mockReturnValue(true);
    const strategy = new S3StorageStrategy(s3Service);

    const result = strategy.keyBelongsToProduct('products/p1/x.jpg', 'p1');

    expect(s3Service.keyBelongsToProduct).toHaveBeenCalledWith(
      'products/p1/x.jpg',
      'p1',
    );
    expect(result).toBe(true);
  });

  it('delegates getPresignedUpload to S3Service.getPresignedUploadPost with the same arguments', async () => {
    const s3Service = createMockS3Service();
    vi.mocked(s3Service.getPresignedUploadPost).mockResolvedValue({
      url: 'https://signed.example/upload',
      fields: { key: 'products/p1/x.jpg' },
    });
    const strategy = new S3StorageStrategy(s3Service);

    const result = await strategy.getPresignedUpload(
      'products/p1/x.jpg',
      900,
      5 * 1024 * 1024,
      'image/jpeg',
    );

    expect(s3Service.getPresignedUploadPost).toHaveBeenCalledWith(
      'products/p1/x.jpg',
      900,
      5 * 1024 * 1024,
      'image/jpeg',
    );
    expect(result).toEqual({
      url: 'https://signed.example/upload',
      fields: { key: 'products/p1/x.jpg' },
    });
  });

  it('delegates getObjectMetadata to S3Service', async () => {
    const s3Service = createMockS3Service();
    vi.mocked(s3Service.getObjectMetadata).mockResolvedValue({
      exists: true,
      sizeBytes: 1024,
    });
    const strategy = new S3StorageStrategy(s3Service);

    const result = await strategy.getObjectMetadata('products/p1/x.jpg');

    expect(s3Service.getObjectMetadata).toHaveBeenCalledWith(
      'products/p1/x.jpg',
    );
    expect(result).toEqual({ exists: true, sizeBytes: 1024 });
  });

  it('delegates delete to S3Service', async () => {
    const s3Service = createMockS3Service();
    const strategy = new S3StorageStrategy(s3Service);

    await strategy.delete('products/p1/x.jpg');

    expect(s3Service.delete).toHaveBeenCalledWith('products/p1/x.jpg');
  });
});
