import { resolveCorsOrigins } from './cors-origins.js';

describe('resolveCorsOrigins', () => {
  it('allows local dev and the deployed Vercel app when CORS_ORIGIN is unset', () => {
    expect(resolveCorsOrigins(undefined)).toEqual([
      'http://localhost:3000',
      'https://export-marketplace-5vp4.vercel.app',
    ]);
  });

  it('keeps the deployed app when CORS_ORIGIN is only localhost', () => {
    expect(resolveCorsOrigins('http://localhost:3000')).toEqual([
      'http://localhost:3000',
      'https://export-marketplace-5vp4.vercel.app',
    ]);
  });

  it('adds extra configured origins', () => {
    expect(
      resolveCorsOrigins(
        'http://localhost:3000, https://preview.example.com',
      ),
    ).toEqual([
      'http://localhost:3000',
      'https://export-marketplace-5vp4.vercel.app',
      'https://preview.example.com',
    ]);
  });
});
