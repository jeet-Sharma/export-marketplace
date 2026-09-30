import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AuthConfig } from '../../config/auth.config.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

/**
 * Provides JwtAuthGuard to any module that needs to protect its
 * controllers. JwtModule.registerAsync here is the SAME factory
 * AuthModule uses (reads the "auth" config namespace, same
 * accessSecret/accessTokenTtlSeconds) — not a second JWT configuration.
 * Nest scopes JwtModule per importing module, so this registration is
 * required for JwtAuthGuard's constructor injection to resolve, but it
 * does not create a second source of truth for the secret: both read the
 * same AuthConfig from ConfigService.
 */
const jwtModule = JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const auth = configService.get<AuthConfig>('auth')!;
    return {
      secret: auth.accessSecret,
      signOptions: { expiresIn: auth.accessTokenTtlSeconds },
    };
  },
});

@Module({
  imports: [jwtModule],
  providers: [JwtAuthGuard],
  // Re-exporting jwtModule (not just JwtAuthGuard) matters: this module is
  // imported separately by both CatalogModule and InventoryModule
  // (InventoryModule is also imported BY CatalogModule), and Nest resolves
  // a @UseGuards(JwtAuthGuard) class reference by instantiating it inside
  // the CONTROLLER's own module — that module's injector needs JwtService
  // visible via its own import graph, not just AuthGuardModule's internal
  // one. Exporting jwtModule alongside JwtAuthGuard makes JwtService
  // resolvable everywhere AuthGuardModule itself is imported.
  exports: [jwtModule, JwtAuthGuard],
})
export class AuthGuardModule {}
