import {
  HttpException,
  HttpStatus,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';
import { ThrottlerGuard, type ThrottlerLimitDetail } from '@nestjs/throttler';

// Thin wrapper around @nestjs/throttler's ThrottlerGuard, matching the
// project's existing convention for small guard subclasses (see
// JwtAuthGuard). Overridden only to produce the same {code, message,
// errors?} structured body every other exception in this API uses — the
// base ThrottlerGuard throws a ThrottlerException with a plain string
// body, which HttpExceptionFilter would otherwise fall through to its
// generic "plain string" branch and report as code: 'INTERNAL_ERROR'
// (its codeForStatus switch has no case for 429), rather than a
// recognizable RATE_LIMITED code a client can branch on.
//
// Applied via @UseGuards(LoginThrottlerGuard) on POST /auth/login and
// POST /auth/refresh specifically (see auth.controller.ts) rather than
// registered globally — these are the two unauthenticated,
// credential/token-bearing endpoints brute-force attempts would target;
// throttling every route (including already-guarded, already-expensive
// admin endpoints) would be a much bigger behavioral change than this
// bug calls for.
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    _context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new HttpException(
      {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        errors: [
          {
            field: 'request',
            message: `Retry after ${throttlerLimitDetail.ttl}ms`,
          },
        ],
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
