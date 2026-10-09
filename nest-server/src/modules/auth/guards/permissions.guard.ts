import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AccessTokenPayload } from '../jwt-payload.interface.js';
import { PERMISSIONS_METADATA_KEY } from '../decorators/require-permissions.decorator.js';

// Must run after JwtAuthGuard (which populates req.user) — apply both via
// @UseGuards(JwtAuthGuard, PermissionsGuard) in that order. Checks the
// permission codes already embedded in the access token payload at issue
// time (see AuthService.issueTokenPair) rather than re-querying the DB on
// every request; a role/permission change takes effect on next token
// refresh, which is an accepted tradeoff for Phase 1.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AccessTokenPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );
    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
