import { HttpException, HttpStatus } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { ThrottlerLimitDetail } from '@nestjs/throttler';
import { LoginThrottlerGuard } from './login-throttler.guard.js';

// Qodo review Bug #7: POST /auth/login and POST /auth/refresh had no rate
// limiting at all, exposing them to brute-force credential guessing and
// unbounded bcrypt.compare CPU cost per attempt. These tests verify the
// guard's structured-error override specifically — the actual
// request-counting/window logic is @nestjs/throttler's own (well-tested)
// responsibility, not something this project needs to re-verify.
describe('LoginThrottlerGuard', () => {
  it('throws an HttpException with the project error envelope shape and a 429 status', async () => {
    // Access the protected method directly without exercising the full
    // ThrottlerGuard constructor (which requires module options/storage
    // DI) — this call only tests the overridden method's own behavior.
    const guard = Object.create(
      LoginThrottlerGuard.prototype,
    ) as LoginThrottlerGuard;
    const throwThrottlingException = (
      guard as unknown as {
        throwThrottlingException: (
          context: ExecutionContext,
          detail: ThrottlerLimitDetail,
        ) => Promise<void>;
      }
    ).throwThrottlingException.bind(guard);

    const detail: ThrottlerLimitDetail = {
      ttl: 42_000,
      limit: 10,
      key: 'test-key',
      tracker: '127.0.0.1',
      totalHits: 11,
      timeToExpire: 42,
      isBlocked: true,
      timeToBlockExpire: 42,
    };

    let caught: unknown;
    try {
      await throwThrottlingException({} as ExecutionContext, detail);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpException);
    const exception = caught as HttpException;
    expect(exception.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(exception.getResponse()).toEqual({
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please try again later.',
      errors: [
        {
          field: 'request',
          message: 'Retry after 42000ms',
        },
      ],
    });
  });
});
