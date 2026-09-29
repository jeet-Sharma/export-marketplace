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
  return {
    isDev: process.env.NODE_ENV !== 'production',
  };
});
