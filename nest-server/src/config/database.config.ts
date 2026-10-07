import { registerAs } from '@nestjs/config';

// Namespaced config factory for Postgres connection settings, loaded into
// ConfigModule.forRoot({ load: [...] }) in app.module.ts. Defaults mirror
// src/database/data-source.ts (the standalone CLI DataSource) so local dev
// without a .env file still resolves to the same local Postgres target.
export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  name: process.env.DB_NAME ?? 'export_marketplace',
}));
