import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { LoginThrottlerGuard } from './guards/login-throttler.guard.js';
import type { AccessTokenPayload } from './jwt-payload.interface.js';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Authenticate a Platform User (section 5.1)' })
  @ApiOkResponse({ type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or inactive account.',
  })
  // Rate limited to curb brute-force credential guessing and the CPU
  // cost each attempt incurs (bcrypt.compare is deliberately slow) — see
  // LoginThrottlerGuard and AuthModule's ThrottlerModule.forRoot comment.
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const authenticatedUser = await this.authService.validateCredentials(
      dto.email,
      dto.password,
    );
    const { accessToken, refreshToken } =
      this.authService.issueTokenPair(authenticatedUser);

    this.setRefreshTokenCookie(res, refreshToken);

    return {
      accessToken,
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        firstName: authenticatedUser.firstName,
        lastName: authenticatedUser.lastName,
        roles: authenticatedUser.roles,
        permissions: authenticatedUser.permissions,
      },
    };
  }

  @ApiOperation({
    summary: 'Issue a refreshed access token (section 5.2)',
    description:
      'Reads the HTTP-only refreshToken cookie set by /auth/login — not part of the request body.',
  })
  @ApiOkResponse({
    schema: { properties: { accessToken: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid, or expired refresh token.',
  })
  // Also unauthenticated and token-bearing — same brute-force/CPU-cost
  // reasoning as POST /auth/login above.
  @UseGuards(LoginThrottlerGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @ApiOperation({ summary: 'End the current session (section 5.3)' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    schema: { properties: { success: { type: 'boolean', example: true } } },
  })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @CurrentUser() _user: AccessTokenPayload,
    @Res({ passthrough: true }) res: Response,
  ): { success: true } {
    // Phase 1 has no server-side refresh-token revocation store (no
    // denylist/session table) — logout clears the cookie client-side.
    // A stolen refresh token issued before logout would remain valid
    // until it naturally expires; revisit if that risk needs closing.
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
    return { success: true };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...this.cookieOptions(),
      maxAge: this.refreshTokenMaxAgeMs(),
    });
  }

  private cookieOptions(): {
    httpOnly: true;
    secure: boolean;
    sameSite: 'strict';
    path: string;
  } {
    return {
      httpOnly: true,
      // Only sent over HTTPS outside local dev — secure cookies are
      // dropped by browsers on plain HTTP, which is expected for local
      // development over http://localhost.
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    };
  }

  private refreshTokenMaxAgeMs(): number {
    const expiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) {
      // Falling back silently here would mean the cookie's lifetime
      // could drift from the JWT's actual expiresIn without any
      // indication something is misconfigured — warn so a bad
      // JWT_REFRESH_EXPIRES_IN value (e.g. "1w" or a bare number) is
      // caught immediately instead of producing a subtly wrong cookie
      // lifetime that's hard to notice.
      this.logger.warn(
        `jwt.refreshExpiresIn ("${expiresIn}") did not match the expected <number><s|m|h|d> ` +
          `format — falling back to a 7 day cookie lifetime. Fix JWT_REFRESH_EXPIRES_IN.`,
      );
      return 7 * 24 * 60 * 60 * 1000;
    }
    const [, amount, unit] = match;
    const unitMs: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return Number(amount) * unitMs[unit];
  }
}
