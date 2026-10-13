import { registerAs } from '@nestjs/config';
import { resolveDbConfig } from './db-env.js';

// Namespaced config factory for Postgres connection settings, loaded into
// ConfigModule.forRoot({ load: [...] }) in app.module.ts.
//
// Uses resolveDbConfig() — the single canonical env-var resolution shared
// with data-source.ts (the TypeORM CLI DataSource) — so the application and
// migration runner always connect to the same database with the same
// precedence (DB_* → POSTGRES_* → defaults). See db-env.ts for details.
export default registerAs('database', () => {
  const db = resolveDbConfig();
  return {
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    name: db.database,
  };
});
