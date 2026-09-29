import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { MessagingModule } from './modules/messaging/messaging.module.js';
import { ReferenceDataModule } from './modules/reference-data/reference-data.module.js';
import { IdentityModule } from './modules/identity/identity.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'export-marketplace',
    }),
    // Config must come before DatabaseModule so ConfigService is available
    // when TypeORM's async factory runs.
    AppConfigModule,
    DatabaseModule,
    // S3 (file storage) and SQS (messaging) — backed by LocalStack in dev,
    // real AWS in production. See docker-compose.yml and .env.example.
    StorageModule,
    MessagingModule,
    // Reference Data, Identity, Catalog and Inventory
    // (Data_Modeling_Complete.md Parts 1-4) — REST APIs for the vendor
    // product/approval workflow and stock. ReferenceDataModule must load
    // first: OrganizationEntity (Identity) and ProductEntity (Catalog)
    // both have @ManyToOne relations into CountryEntity/CurrencyEntity, so
    // those entities must be registered somewhere in the module graph for
    // TypeORM to resolve them, even though no controller here reads from
    // ReferenceDataModule directly yet. IdentityModule loads before
    // CatalogModule, which imports it for cross-module entities
    // (organization, vendor_target_country).
    ReferenceDataModule,
    IdentityModule,
    CatalogModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
