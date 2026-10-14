/**
 * Resolves Postgres connection settings from environment variables with a
 * single, canonical precedence order used by BOTH the Nest application
 * (database.config.ts) AND the TypeORM CLI DataSource (data-source.ts).
 *
 * Precedence (first defined value wins):
 *   1. DB_*       — application-level vars set by Docker Compose api service
 *                   and nest-server/.env (the authoritative source).
 *   2. POSTGRES_* — Docker Compose postgres-service vars that may bleed into
 *                   the shell environment; accepted as a fallback so the CLI
 *                   works without a .env file in a plain `docker compose exec`
 *                   shell.
 *   3. Hardcoded defaults — safe local-dev values so the app/CLI boots in CI
 *                   and developer machines without any env file.
 *
 * Having both sets of vars present (the scenario that caused divergence) is
 * intentionally handled by always preferring DB_* so the two callers always
 * resolve identically. Running migrations against a different database than
 * the app is connecting to is the worst possible outcome of a mismatch —
 * this helper makes that impossible.
 */
export function resolveDbConfig() {
  return {
    host: process.env.DB_HOST ?? process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? process.env.POSTGRES_PORT ?? 5432),
    username:
      process.env.DB_USERNAME ?? process.env.POSTGRES_USER ?? 'postgres',
    password:
      process.env.DB_PASSWORD ?? process.env.POSTGRES_PASSWORD ?? 'postgres',
    database:
      process.env.DB_NAME ?? process.env.POSTGRES_DB ?? 'export_marketplace',
  };
}
