// jwt.config.ts runs its validation as top-level module code (so it fires
// once at app startup, not lazily on first config read) — these tests
// exercise that by resetting the module registry and re-importing with
// different env vars/NODE_ENV for each case, which is the only way to
// re-trigger top-level code with vitest.
describe('jwt.config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  async function importConfig() {
    return import('./jwt.config.js');
  }

  it('throws in production when JWT_ACCESS_SECRET is a known placeholder', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'dev-only-insecure-access-secret';
    process.env.JWT_REFRESH_SECRET = 'a-sufficiently-random-refresh-secret';

    await expect(importConfig()).rejects.toThrow(/placeholder/i);
  });

  it('throws in production when JWT_ACCESS_SECRET matches the .env.docker.example placeholder', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'change-me-access-secret';
    process.env.JWT_REFRESH_SECRET = 'a-sufficiently-random-refresh-secret';

    await expect(importConfig()).rejects.toThrow(/placeholder/i);
  });

  it('throws in production when either secret is unset', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = 'a-sufficiently-random-refresh-secret';

    await expect(importConfig()).rejects.toThrow(/not set/i);
  });

  it('throws in production when access and refresh secrets are equal', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'the-exact-same-value';
    process.env.JWT_REFRESH_SECRET = 'the-exact-same-value';

    await expect(importConfig()).rejects.toThrow(/must be different/i);
  });

  it('does not throw in production with two different, non-placeholder secrets', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'a-sufficiently-random-access-secret';
    process.env.JWT_REFRESH_SECRET = 'a-different-sufficiently-random-secret';

    await expect(importConfig()).resolves.toBeDefined();
  });

  it('does not throw outside production even with placeholder secrets (warns instead)', async () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_ACCESS_SECRET = 'dev-only-insecure-access-secret';
    process.env.JWT_REFRESH_SECRET = 'dev-only-insecure-refresh-secret';

    await expect(importConfig()).resolves.toBeDefined();
  });

  it('falls back to the dev placeholder values when unset outside production', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    const { default: jwtConfig } = await importConfig();
    const config = jwtConfig();

    expect(config.accessSecret).toBe('dev-only-insecure-access-secret');
    expect(config.refreshSecret).toBe('dev-only-insecure-refresh-secret');
  });
});
