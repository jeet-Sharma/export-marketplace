import { DataSource } from 'typeorm';
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
// to diff these entities against the current schema. This is intentionally
// not wired into AppModule yet — AppModule does not import TypeOrmModule,
// so nothing in the running app talks to Postgres. Once that's deliberately
// added, this config (or an equivalent one built via @nestjs/typeorm's
// forRootAsync) should become the source the app itself connects with, so
// schema and migration history stay in one place.
// Connection settings prefer the POSTGRES_* names that the Compose stacks
// inject into the api container (so migrations run inside Docker reach the
// `postgres` service with the stack's real credentials), and fall back to the
// DB_* names used for standalone local CLI runs, then to safe local defaults.
// Read directly via process.env — this file runs standalone under the TypeORM
// CLI, outside Nest's DI container, so ConfigService is not available here.
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? process.env.DB_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? process.env.DB_USERNAME ?? 'postgres',
  password:
    process.env.POSTGRES_PASSWORD ?? process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? process.env.DB_NAME ?? 'export_marketplace',
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
  // Match both the TS source (CLI via tsx in dev) and the compiled output
  // (dist/**/migrations/*.js in the production image), so `migration:run`
  // works in either context.
  migrations: [
    'src/database/migrations/*.ts',
    'dist/database/migrations/*.js',
  ],
  migrationsTableName: 'migrations',
  // Schema must only ever change via migrations, never auto-sync.
  synchronize: false,
});

export default dataSource;
