import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AccessTokenPayload } from '../jwt-payload.interface.js';

// Extracts the decoded access-token payload attached by JwtStrategy.
// Usage: findAll(@CurrentUser() user: AccessTokenPayload)
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AccessTokenPayload => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AccessTokenPayload }>();
  return request.user;
});
