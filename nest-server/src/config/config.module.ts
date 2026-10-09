import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './database.config.js';
import jwtConfig from './jwt.config.js';

// Centralized env access. Factories under src/config/ provide safe
// defaults via `??`/`||` so the app still boots in CI/test environments
// without a .env file — don't add a strict/throwing env validator that
// hard-requires variables these factories can already default safely.
//
// aws.config.ts is deliberately NOT loaded here — AwsModule registers it
// itself via ConfigModule.forFeature(awsConfig) and injects it with
// @Inject(awsConfig.KEY), which is a different (and incompatible)
// registration style than this module's registerAs()+ConfigService.get()
// pattern for database/jwt. Loading it both ways would register the
// 'aws' namespace twice.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
  ],
})
export class AppConfigModule {}
