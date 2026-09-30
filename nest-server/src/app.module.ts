import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { MessagingModule } from './modules/messaging/messaging.module.js';
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
    // AuthModule (POST /auth/register) is the first module with an actual
    // controller that needs the real DataSource. test/*.e2e-spec.ts no
    // longer mocks DatabaseModule (it boots against a real Postgres), and
    // .github/workflows/ci.yml's "API" job provisions a Postgres service
    // container + runs migrations before the e2e step.
    AuthModule,
    // Note: ReferenceDataModule/IdentityModule (Data_Modeling_Complete.md
    // Parts 1-2 entities) are intentionally NOT imported here yet — nothing
    // has a controller/service that reads or writes them through Nest DI
    // yet (AuthModule reaches their entities via DataSource.transaction
    // directly, not via these modules). The entities are still registered
    // with the real DataSource via db.config.ts's `entities` array, so
    // migrations/schema work today; wire each module in once its first
    // real consumer (a controller/service) is built.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
