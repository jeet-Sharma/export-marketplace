import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import awsConfig from './aws.config.js';
import dbConfig from './db.config.js';

/**
 * Global, application-wide environment configuration. Imported once from
 * AppModule; every other module reads settings via ConfigService instead of
 * touching process.env directly.
 *
 * No strict env validation here: aws.config.ts already falls back to safe
 * defaults (LocalStack-friendly dummy credentials, default bucket/queue
 * names) for every AWS_* variable, and db.config.ts falls back to the local
 * Docker Compose defaults, so local dev, CI, and unit/e2e tests all boot
 * without requiring a .env file. Override the defaults via .env for anything
 * environment-specific (see .env.example).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      load: [awsConfig, dbConfig],
    }),
  ],
})
export class AppConfigModule {}
