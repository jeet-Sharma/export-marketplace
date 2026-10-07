import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { createObserveModule } from '@nestjs/observe';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AwsModule } from './aws/aws.module.js';
import { AppConfigModule } from './config/config.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { CountriesModule } from './modules/countries/countries.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { PublicProductsModule } from './modules/public-products/public-products.module.js';
import { VendorsModule } from './modules/vendors/vendors.module.js';
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
} from './database/entities/index.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Loads .env and makes ConfigService available application-wide.
    ConfigModule.forRoot({ isGlobal: true }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'export-marketplace',
    }),
    // S3 + SQS integration (LocalStack locally, real AWS in production).
    AwsModule,
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
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
        // Schema changes only ever happen via migrations (npm run
        // migration:run) — never auto-sync, even in development.
        synchronize: false,
      }),
    }),
    AuthModule,
    ProductsModule,
    PublicProductsModule,
    VendorsModule,
    CategoriesModule,
    CountriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
