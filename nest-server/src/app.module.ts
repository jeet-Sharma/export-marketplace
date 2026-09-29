import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './modules/database/database.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { MessagingModule } from './modules/messaging/messaging.module.js';

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
    // Note: ReferenceDataModule (Data_Modeling_Complete.md Part 1 entities)
    // is intentionally NOT imported here yet. AppModule's e2e test
    // (test/app.e2e-spec.ts) overrides DatabaseModule with a no-op mock to
    // avoid requiring live Postgres, and TypeOrmModule.forFeature (used by
    // ReferenceDataModule) cannot be satisfied by that mock. The entities
    // are still registered with the real DataSource via db.config.ts's
    // `entities` array, so migrations/schema work today; wire
    // ReferenceDataModule into a controller/service-bearing module (and
    // provision Postgres in CI for e2e) when the first consumer is built.
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
