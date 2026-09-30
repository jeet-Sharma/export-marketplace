import { existsSync, readFileSync } from 'fs';
import { DataSource } from 'typeorm';
import { ENTITIES } from './entities.js';

// Minimal .env loader for the CLI context only (no dotenv dependency —
// see backend-rules.md: don't add a dependency for something already
// solved). The running Nest app loads .env via @nestjs/config instead
// (see AppConfigModule); this only covers `npm run migration:*`.
function loadDotEnvIfPresent(): void {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnvIfPresent();

/**
 * Plain TypeORM DataSource used only by the TypeORM CLI (migration:run,
 * migration:generate, migration:revert — see package.json scripts).
 *
 * This is separate from DatabaseModule's TypeOrmModule.forRootAsync, which
 * is what the running Nest app actually connects with. The CLI can't go
 * through Nest's DI/ConfigService, so it reads process.env directly here
 * instead, mirroring the same defaults as src/config/db.config.ts. The
 * entity list is imported (ENTITIES) rather than re-declared, so the CLI and
 * the app can never disagree about which entities exist.
 *
 * Migrations are the source of truth for the domain schema (Data_Modeling_Complete.md,
 * "Document 6 — Complete Data Model v3") because that schema relies on
 * PostgreSQL features synchronize cannot express reliably: custom domains,
 * generated/STORED columns, exclusion constraints, and partial unique
 * indexes. `synchronize` is not set here (defaults to false) and is also
 * forced off on the app's own DataSource — see db.config.ts.
 */
const isProd = process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'export_marketplace',
  ssl: isProd ? { rejectUnauthorized: false } : false,
  entities: ENTITIES, // single source of truth — see config/entities.ts
  // Migration source depends on how this DataSource is loaded:
  //   - dev/CI:  via typeorm-ts-node-esm against the .ts sources
  //   - prod:    via the plain `typeorm` CLI against compiled dist/*.js
  //              (the production image has no ts-node — see Dockerfile).
  // MIGRATIONS_COMPILED=true selects the compiled path.
  migrations:
    process.env.MIGRATIONS_COMPILED === 'true'
      ? ['dist/database/migrations/*.js']
      : ['src/database/migrations/*.ts'],
  logging: process.env.TYPEORM_LOGGING === 'true',
});
