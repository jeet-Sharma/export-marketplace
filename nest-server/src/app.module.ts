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
import { AuthModule } from './modules/auth/auth.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

// Observe (distributed tracing/telemetry) is only enabled when real
// credentials are supplied via env. Previously it started with the
// placeholder YOUR_APP_KEY/YOUR_APP_SECRET, which made it retry and log a
// "Telemetry rejected (401)" error on every boot for no benefit. With no
// credentials, it is simply not imported.
const observeAppKey = process.env.OBSERVE_APP_KEY;
const observeAppSecret = process.env.OBSERVE_APP_SECRET;
export const observeEnabled = Boolean(observeAppKey && observeAppSecret);
const observeImports =
  observeAppKey && observeAppSecret
    ? [
      ObserveModule.forRoot({
        appKey: observeAppKey,
        appSecret: observeAppSecret,
        serviceId: 'export-marketplace',
      }),
    ]
    : [];

@Module({
  imports: [
    ...observeImports,
    // Modules that set up infrastructure services used by other modules: 
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
    // AuthModule (POST /auth/register) is the first module whose
    // controller/service actually reaches Identity entities through Nest
    // DI transactions (DataSource.transaction, not @InjectRepository) —
    // see AuthModule's own doc comment. Placed after
    // Identity/Catalog/Inventory since it depends on RoleEntity being
    // seeded by the SeedBuyerRole migration, which itself depends on
    // CreateCompaniesPeopleAccess having already run.
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
