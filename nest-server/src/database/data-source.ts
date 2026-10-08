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
// to diff these entities against the current schema. AppModule wires up its
// own connection via TypeOrmModule.forRootAsync (see app.module.ts), reading
// the same DB_* env vars through database.config.ts — kept as a separate
// DataSource here only because the TypeORM CLI needs one outside of Nest's
// DI container, not because the app itself skips TypeOrmModule.
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
