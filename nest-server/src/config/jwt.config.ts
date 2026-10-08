import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';

const logger = new Logger('JwtConfig');

// Namespaced JWT config. accessSecret/refreshSecret default to a dev-only
// placeholder so the app still boots without a .env file (same convention
// as database.config.ts) — but these MUST be overridden with real secrets
// outside local development. Never commit real values.
//
// Unlike database.config.ts's defaults (which are harmless local-dev
// connection parameters), a fallback here means every access/refresh
// token in this environment is signed with a secret anyone can read in
// this file — booting silently on that fallback is the kind of mistake
// that's easy to ship by accident. Logger.warn makes it visible in
// startup logs, matching the "fail loud, not silent" convention used
// elsewhere (e.g. StorageService's 503-on-unreachable-bucket).
if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  logger.warn(
    'JWT_ACCESS_SECRET and/or JWT_REFRESH_SECRET are not set — falling back to ' +
      'insecure dev-only placeholder secrets. This is fine for local development ' +
      'but must never happen in a shared or production environment.',
  );
}

export default registerAs('jwt', () => ({
  accessSecret:
    process.env.JWT_ACCESS_SECRET ?? 'dev-only-insecure-access-secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ?? 'dev-only-insecure-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));
