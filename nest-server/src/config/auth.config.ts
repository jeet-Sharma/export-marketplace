import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  maxFailedLogins: number;
  lockoutMinutes: number;
}

/**
 * Authentication configuration, namespaced under "auth" in ConfigService.
 * Secrets intentionally default to empty strings: production must configure
 * them explicitly, and no credential is hardcoded in source. Login returns a
 * safe service-unavailable error until both secrets exist.
 */
export default registerAs('auth', (): AuthConfig => ({
  accessSecret: process.env.AUTH_ACCESS_SECRET ?? '',
  refreshSecret: process.env.AUTH_REFRESH_SECRET ?? '',
  accessTokenTtlSeconds: parseInt(process.env.AUTH_ACCESS_TTL_SECONDS ?? '900', 10),
  refreshTokenTtlSeconds: parseInt(process.env.AUTH_REFRESH_TTL_SECONDS ?? '2592000', 10),
  maxFailedLogins: parseInt(process.env.AUTH_MAX_FAILED_LOGINS ?? '5', 10),
  lockoutMinutes: parseInt(process.env.AUTH_LOCKOUT_MINUTES ?? '15', 10),
}));
