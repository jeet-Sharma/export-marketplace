import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { resolveDbConfig } from '../config/db-env.js';
import {
  Category,
  Country,
  Permission,
  Product,
  ProductCountry,
  ProductImage,
  ProductPriceTier,
  Role,
  RolePermission,
  User,
  UserRole,
  Vendor,
} from './entities/index.js';

// Standalone TypeORM DataSource used by the TypeORM CLI for generating and
// running migrations (npm run migration:*), and for `migration:generate`
// to diff these entities against the current schema. AppModule wires up its
// own connection via TypeOrmModule.forRootAsync (see app.module.ts), reading
// the same env vars through database.config.ts — kept as a separate DataSource
// only because the TypeORM CLI needs one outside of Nest's DI container.
//
// Both this file and database.config.ts call resolveDbConfig() (db-env.ts) so
// the migration runner and the application ALWAYS resolve the same host/port/
// credentials with the same precedence (DB_* → POSTGRES_* → defaults),
// eliminating the risk of running migrations against a different database.
const { host, port, username, password, database } = resolveDbConfig();
const dataSource = new DataSource({
  type: 'postgres',
  host,
  port,
  username,
  password,
  database,
  entities: [
    Country,
    Vendor,
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    Category,
    Product,
    ProductImage,
    ProductPriceTier,
    ProductCountry,
  ],
  // Single __dirname-relative glob so TypeORM never loads both the .ts
  // sources and the compiled .js output at the same time.
  //
  // When the TypeORM CLI runs this file via tsx (dev / migration:generate),
  // import.meta.url resolves to src/database/data-source.ts, so __dirname
  // becomes src/database/ and the pattern matches only the .ts sources.
  //
  // When the compiled dist/database/data-source.js runs (migration:run in
  // the production image), __dirname becomes dist/database/ and the pattern
  // matches only the .js output — never both at once.
  //
  // `(?<!\.)d\.ts` is excluded via the negative-lookahead in the js/ts
  // alternation: *.{ts,js} with `declaration:true` in tsconfig would
  // otherwise also match *.d.ts declaration files. TypeORM's glob engine
  // supports the brace-expansion syntax used here.
  migrations: [
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'migrations',
      '*.{ts,js}',
    ),
  ],
  migrationsTableName: 'migrations',
  // Schema must only ever change via migrations, never auto-sync.
  synchronize: false,
});

export default dataSource;
