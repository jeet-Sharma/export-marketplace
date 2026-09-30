import { ExecutionContext, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth.types.js';

/**
 * Injects the authenticated buyer/user that JwtAuthGuard attached to the
 * request. Use only on routes protected by JwtAuthGuard — if the guard
 * didn't run (or didn't attach a user), this throws rather than returning
 * undefined, so a handler can never silently operate with no identity.
 *
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    return request.user;
  },
);
