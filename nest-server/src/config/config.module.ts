import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import awsConfig from './aws.config.js';
import databaseConfig from './database.config.js';
import jwtConfig from './jwt.config.js';

// Centralized env access. Factories under src/config/ provide safe
// defaults via `??`/`||` so the app still boots in CI/test environments
// without a .env file — don't add a strict/throwing env validator that
// hard-requires variables these factories can already default safely.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, awsConfig],
    }),
  ],
})
export class AppConfigModule {}
