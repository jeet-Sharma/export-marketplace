import {
  CanActivate,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { awsConfig } from '../config/aws.config.js';

/**
 * Gates the unauthenticated /aws-demo helper routes behind config.
 *
 * The decision is made from the loaded AwsConfig (ConfigService), not from
 * process.env read at module-import time — the latter is evaluated before
 * ConfigModule.forRoot() loads the app's .env, so a flag set only in that
 * file would be missed. Checking here, per request, is timing-safe.
 *
 * When demo routes are disabled we throw NotFound (not Forbidden) so the
 * endpoints are indistinguishable from non-existent routes in production.
 */
@Injectable()
export class AwsDemoGuard implements CanActivate {
  constructor(
    @Inject(awsConfig.KEY) private readonly config: ConfigType<typeof awsConfig>,
  ) {}

  canActivate(): boolean {
    if (!this.config.enableDemoRoutes) {
      throw new NotFoundException();
    }
    return true;
  }
}
