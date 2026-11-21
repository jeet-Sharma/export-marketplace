import { afterEach, describe, expect, it } from 'vitest';
import { resolveDbConfig } from './db-env.js';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('resolveDbConfig SSL', () => {
  it('omits ssl when DB_SSL is unset', () => {
    delete process.env.DB_SSL;
    expect(resolveDbConfig().ssl).toBeUndefined();
  });

  it('enables ssl with rejectUnauthorized false when DB_SSL=true', () => {
    process.env.DB_SSL = 'true';
    delete process.env.DB_SSL_REJECT_UNAUTHORIZED;
    expect(resolveDbConfig().ssl).toEqual({ rejectUnauthorized: false });
  });

  it('honors DB_SSL_REJECT_UNAUTHORIZED=true', () => {
    process.env.DB_SSL = '1';
    process.env.DB_SSL_REJECT_UNAUTHORIZED = 'true';
    expect(resolveDbConfig().ssl).toEqual({ rejectUnauthorized: true });
  });
});
