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
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'export_marketplace',
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
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  // Schema must only ever change via migrations, never auto-sync.
  synchronize: false,
});

export default dataSource;
