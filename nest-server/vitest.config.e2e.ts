import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// AppConfigModule ignores .env when NODE_ENV=test (see config.module.ts) so
// that CI/e2e stays hermetic and doesn't accidentally pick up a developer's
// local overrides. But e2e still needs to know which Postgres/LocalStack
// instance to connect to on a given machine (e.g. a non-default port to
// avoid colliding with another project's Postgres container) — loadEnv
// reads .env here, in Vitest's own config step, and copies it onto
// process.env for this test run only. Nest's ConfigModule still ignores
// the .env FILE itself; this just seeds the same values it would have
// read from that file, so local .env overrides keep working for e2e
// without changing AppConfigModule's test-mode behavior.
const env = loadEnv('test', process.cwd(), '');
for (const [key, value] of Object.entries(env)) {
  process.env[key] ??= value;
}

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
  },
});
