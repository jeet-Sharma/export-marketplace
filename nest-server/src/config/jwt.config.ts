import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';

const logger = new Logger('JwtConfig');

const DEV_ACCESS_SECRET_PLACEHOLDER = 'dev-only-insecure-access-secret';
const DEV_REFRESH_SECRET_PLACEHOLDER = 'dev-only-insecure-refresh-secret';

// Known-public placeholder values that must never reach a production
// deployment — anyone who has read this file (or .env.docker.example, or
// git history) can forge a JWT signed with any of these. Checked
// case-insensitively and trimmed so "Change-Me-Access-Secret " still
// matches. Keep this list in sync with .env.docker.example.
const KNOWN_PLACEHOLDER_SECRETS = new Set(
  [
    DEV_ACCESS_SECRET_PLACEHOLDER,
    DEV_REFRESH_SECRET_PLACEHOLDER,
    'change-me-access-secret',
    'change-me-refresh-secret',
  ].map((value) => value.toLowerCase()),
);

function isPlaceholderSecret(secret: string | undefined): boolean {
  if (!secret) {
    return false;
  }
  return KNOWN_PLACEHOLDER_SECRETS.has(secret.trim().toLowerCase());
}

// Namespaced JWT config. accessSecret/refreshSecret default to a dev-only
// placeholder so the app still boots without a .env file (same convention
// as database.config.ts) — but these MUST be overridden with real secrets
// outside local development. Never commit real values.
//
// Unlike database.config.ts's defaults (which are harmless local-dev
// connection parameters), a fallback here means every access/refresh
// token in this environment is signed with a secret anyone can read in
// this file — booting silently on that fallback is the kind of mistake
// that's easy to ship by accident.
//
// In production (NODE_ENV=production) this is upgraded from a warning to
// a hard failure: the app refuses to boot if either secret is unset, is a
// known placeholder (including .env.docker.example's "change-me-*"
// values), or if access/refresh end up equal — all three are the exact
// mistakes a `:?` presence-only guard in docker-compose.yml cannot catch
// (it only checks the var is set, not that its value is safe). Outside
// production, the same conditions only log a warning so local development
// stays convenient.
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;
const isProduction = process.env.NODE_ENV === 'production';

const problems: string[] = [];
if (!accessSecret) {
  problems.push('JWT_ACCESS_SECRET is not set');
} else if (isPlaceholderSecret(accessSecret)) {
  problems.push('JWT_ACCESS_SECRET is set to a known placeholder value');
}
if (!refreshSecret) {
  problems.push('JWT_REFRESH_SECRET is not set');
} else if (isPlaceholderSecret(refreshSecret)) {
  problems.push('JWT_REFRESH_SECRET is set to a known placeholder value');
}
if (accessSecret && refreshSecret && accessSecret === refreshSecret) {
  problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different');
}

if (problems.length > 0) {
  const message =
    `Insecure JWT configuration: ${problems.join('; ')}. ` +
    'Generate strong random secrets, e.g. `openssl rand -hex 32`, and set ' +
    'JWT_ACCESS_SECRET / JWT_REFRESH_SECRET to different values.';
  if (isProduction) {
    // Fail fast — never let the app accept traffic while able to sign/verify
    // tokens with a secret an attacker can already guess or read.
    throw new Error(message);
  }
  logger.warn(
    `${message} This is fine for local development but must never happen ` +
      'in a shared or production environment.',
  );
}

export default registerAs('jwt', () => ({
  accessSecret: accessSecret ?? DEV_ACCESS_SECRET_PLACEHOLDER,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshSecret: refreshSecret ?? DEV_REFRESH_SECRET_PLACEHOLDER,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));
