// jwt.config.ts's validation runs lazily, inside the registerAs() factory
// callback — not at module top-level — specifically so it only fires once
// ConfigModule.forRoot() has loaded .env into process.env (see jwt.config.ts's
// comment on this). That means importing the module no longer triggers
// validation by itself; these tests call the exported factory function
// (`jwtConfig()`) to trigger it, resetting the module registry between
// cases so each test still gets a clean module state.
describe('jwt.config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  async function loadFactory() {
    const { default: jwtConfig } = await import('./jwt.config.js');
    return jwtConfig;
  }

  it('throws in production when JWT_ACCESS_SECRET is a known placeholder', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'dev-only-insecure-access-secret';
    process.env.JWT_REFRESH_SECRET = 'a-sufficiently-random-refresh-secret';

    const jwtConfig = await loadFactory();
    expect(() => jwtConfig()).toThrow(/placeholder/i);
  });

  it('throws in production when JWT_ACCESS_SECRET matches the .env.docker.example placeholder', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'change-me-access-secret';
    process.env.JWT_REFRESH_SECRET = 'a-sufficiently-random-refresh-secret';

    const jwtConfig = await loadFactory();
    expect(() => jwtConfig()).toThrow(/placeholder/i);
  });

  it('throws in production when either secret is unset', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = 'a-sufficiently-random-refresh-secret';

    const jwtConfig = await loadFactory();
    expect(() => jwtConfig()).toThrow(/not set/i);
  });

  it('throws in production when access and refresh secrets are equal', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'the-exact-same-value';
    process.env.JWT_REFRESH_SECRET = 'the-exact-same-value';

    const jwtConfig = await loadFactory();
    expect(() => jwtConfig()).toThrow(/must be different/i);
  });

  it('does not throw in production with two different, non-placeholder secrets', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'a-sufficiently-random-access-secret';
    process.env.JWT_REFRESH_SECRET = 'a-different-sufficiently-random-secret';

    const jwtConfig = await loadFactory();
    expect(() => jwtConfig()).not.toThrow();
  });

  it('does not throw outside production even with placeholder secrets (warns instead)', async () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_ACCESS_SECRET = 'dev-only-insecure-access-secret';
    process.env.JWT_REFRESH_SECRET = 'dev-only-insecure-refresh-secret';

    const jwtConfig = await loadFactory();
    expect(() => jwtConfig()).not.toThrow();
  });

  it('falls back to the dev placeholder values when unset outside production', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    const jwtConfig = await loadFactory();
    const config = jwtConfig();

    expect(config.accessSecret).toBe('dev-only-insecure-access-secret');
    expect(config.refreshSecret).toBe('dev-only-insecure-refresh-secret');
  });

  it('does not throw merely from importing the module, even with bad production secrets', async () => {
    // Regression guard for the exact bug this fix addresses: validation
    // must not run at import time, since that happens before
    // ConfigModule.forRoot() has loaded .env into process.env in a real
    // app boot — only calling the returned factory should trigger it.
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    await expect(import('./jwt.config.js')).resolves.toBeDefined();
  });
});
