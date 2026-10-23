import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AccessTokenPayload } from '../jwt-payload.interface.js';

// Validates the short-lived access token sent as `Authorization: Bearer
// <token>`, per Phase-1-API-Specification-v0.1 section 2 ("Bearer JWT for
// protected Platform APIs"). The refresh token is handled separately
// (cookie-based, see auth.controller.ts) and never accepted here.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  validate(payload: AccessTokenPayload): AccessTokenPayload {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    // Attached to req.user by Passport.
    return payload;
  }
}
