import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import type { AuthConfig } from '../../config/auth.config.js';
import { OrganizationEntity } from '../../modules/identity/entities/organization.entity.js';
import { UserEntity } from '../../modules/identity/entities/user.entity.js';
import { UserRoleEntity } from '../../modules/identity/entities/user-role.entity.js';
import type { AuthenticatedRequest, RequestContext } from '../types/request-context.type.js';

/**
 * The first (and only) request-authentication guard in this codebase.
 * AuthModule signs access tokens (AuthService.loginBuyer()) but — per its
 * own doc comment — deliberately does not verify them anywhere; this guard
 * is that missing verification step, reusing AuthModule's own JwtService
 * and AuthConfig rather than inventing a second token scheme.
 *
 * Verifies the `Authorization: Bearer <token>` access token against the
 * SAME secret/algorithm AuthService.loginBuyer() signs with
 * ({ sub, publicId, userType }, authConfig.accessSecret), loads the
 * referenced user's current organizationId + role codes, and populates
 * `req.user` to satisfy RequestContext (request-context.type.ts) — the
 * contract catalog/inventory controllers already read from.
 *
 * Deliberately NOT a Passport strategy: AuthModule doesn't use
 * @nestjs/passport anywhere (it signs/verifies tokens directly via
 * JwtService), so a bespoke CanActivate guard matches how tokens already
 * work here instead of introducing a second auth library.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const authConfig = this.configService.get<AuthConfig>('auth');
    if (!authConfig?.accessSecret) {
      // Matches AuthService.loginBuyer()'s own guard: no secret configured
      // means auth is not usable, not that every request is anonymous.
      throw new UnauthorizedException('Authentication is not configured.');
    }

    let payload: { sub: string; publicId: string; userType: string };
    try {
      payload = await this.jwtService.verifyAsync(token, { secret: authConfig.accessSecret });
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const user = await this.dataSource.getRepository(UserEntity).findOne({ where: { id: payload.sub } });
    if (!user || user.status === 'BLOCKED' || user.status === 'ANONYMISED') {
      throw new UnauthorizedException('Account is not active.');
    }

    // A user's own status can be ACTIVE while their organization is
    // SUSPENDED/BLOCKED (Part 2.1) — e.g. a platform admin suspends a
    // vendor for a compliance issue without individually blocking every
    // employee's login. Without this check, every vendor/platform member
    // of a suspended organization would keep full catalog/inventory access
    // as long as their own access token stays valid. Buyers have no
    // organization (organizationId is null) and are unaffected.
    if (user.organizationId) {
      const organization = await this.dataSource
        .getRepository(OrganizationEntity)
        .findOne({ where: { id: user.organizationId } });
      if (!organization || organization.status !== 'APPROVED') {
        throw new UnauthorizedException('Organization is not active.');
      }
    }

    const userRoles = await this.dataSource
      .getRepository(UserRoleEntity)
      .createQueryBuilder('userRole')
      .innerJoinAndSelect('userRole.role', 'role')
      .where('userRole.userId = :userId', { userId: user.id })
      .getMany();

    const requestContext: RequestContext = {
      userId: user.id,
      organizationId: user.organizationId,
      userType: user.userType,
      roles: userRoles.map((userRole) => userRole.role!.code),
    };

    request.user = requestContext;
    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;
    return token;
  }
}
