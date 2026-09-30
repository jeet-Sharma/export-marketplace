import { registerAs } from '@nestjs/config';

export interface AppConfig {
  isDev: boolean;
}

/**
 * General app-level configuration, namespaced under "app" in ConfigService.
 * Reads directly from process.env because this factory runs once at module
 * init (same pattern as aws.config.ts/db.config.ts) — services elsewhere
 * read this via ConfigService, never process.env directly (backend-rules.md).
 *
 * isDev is an explicit allowlist (NODE_ENV === 'development'), not a
 * denylist of just "not production" — AuthService gates dev-only logging
 * of the raw email-verification token on this flag (security-rules.md:
 * never log credentials/tokens), and a denylist would have logged that
 * token in every non-production environment, including staging and CI,
 * not just a developer's own machine.
 */
export default registerAs('app', (): AppConfig => {
  return {
    isDev: process.env.NODE_ENV === 'development',
  };
});
