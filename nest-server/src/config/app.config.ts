import { registerAs } from '@nestjs/config';

export interface AppConfig {
  isDev: boolean;
}

/**
 * General app-level configuration, namespaced under "app" in ConfigService.
 * Reads directly from process.env because this factory runs once at module
 * init (same pattern as aws.config.ts/db.config.ts) — services elsewhere
 * read this via ConfigService, never process.env directly (backend-rules.md).
 */
export default registerAs('app', (): AppConfig => {
  // Only an explicit development environment counts as "dev". Anything else
  // — production AND test — is treated as non-dev, so dev-only side effects
  // like logging a raw verification token can never fire during test runs
  // (NODE_ENV=test) or in production. Local dev defaults to dev when
  // NODE_ENV is unset.
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  return {
    isDev: nodeEnv === 'development',
  };
});
