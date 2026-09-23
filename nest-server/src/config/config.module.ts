import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import awsConfig from './aws.config.js';
import { validateEnv } from './env.validation.js';

/**
 * Global, application-wide environment configuration. Imported once from
 * AppModule; every other module reads settings via ConfigService instead of
 * touching process.env directly.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [awsConfig],
      validate: validateEnv,
    }),
  ],
})
export class AppConfigModule {}
