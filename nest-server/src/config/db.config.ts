import { registerAs } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';

export interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  synchronize: boolean;
  logging: boolean;
}

/**
 * PostgreSQL / TypeORM configuration, namespaced under "db" in ConfigService.
 *
 * synchronize is enabled only in development so the DB schema stays in sync
 * with entities during active development without running migrations.
 * It is explicitly disabled in production — use TypeORM migrations there.
 *
 * ssl is enabled in production (most managed Postgres providers require it)
 * and disabled locally against the Docker container.
 */
export default registerAs('db', (): DbConfig => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'export_marketplace',
    ssl: isProd,
    synchronize: !isProd,
    logging: process.env.TYPEORM_LOGGING === 'true',
  };
});

/**
 * Builds a TypeORM DataSourceOptions object from a DbConfig.
 * Used by DatabaseModule so the TypeORM forRootAsync factory stays clean.
 */
export function buildDataSourceOptions(cfg: DbConfig): DataSourceOptions {
  return {
    type: 'postgres',
    host: cfg.host,
    port: cfg.port,
    username: cfg.username,
    password: cfg.password,
    database: cfg.database,
    ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
    synchronize: cfg.synchronize,
    logging: cfg.logging,
    // Entities and migrations will be registered here once the domain
    // modules are created. Glob patterns work in both dev (ts-node) and
    // prod (compiled dist/).
    entities: [],
    migrations: [],
  };
}
