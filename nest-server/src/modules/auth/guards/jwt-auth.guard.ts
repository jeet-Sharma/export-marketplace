import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { DataSource } from 'typeorm';
import type { AuthConfig } from '../../../config/auth.config.js';
import { PermissionEntity } from '../../identity/entities/permission.entity.js';
import { RolePermissionEntity } from '../../identity/entities/role-permission.entity.js';
import { RoleEntity } from '../../identity/entities/role.entity.js';
import { UserRoleEntity } from '../../identity/entities/user-role.entity.js';
import { UserEntity } from '../../identity/entities/user.entity.js';
import type { AccessTokenPayload, AuthenticatedUser } from '../auth.types.js';

/**
 * Protects routes by requiring a valid Bearer access token.
 *
 * On success it attaches an AuthenticatedUser to `request.user`, derived
 * from the verified token plus a fresh DB status check — this is the only
 * sanctioned source of a caller's identity (security-rules.md: never trust a
 * client-supplied user/org id). Controllers read it via @CurrentUser().
 *
 * The DB re-check means a token that is still cryptographically valid is
 * rejected the moment the account is blocked, anonymised, or otherwise not
 * ACTIVE — a stolen/leaked token can't outlive the account's good standing.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.authConfig = this.configService.get<AuthConfig>('auth')!;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.authConfig.accessSecret,
      });
    } catch {
      // Expired, tampered, or signed with the wrong secret — all indistinct.
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const user = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .where('user.id = :id', { id: payload.sub })
      .getOne();

    // Reject if the account no longer exists or is not in good standing,
    // even if the token itself is still valid.
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const { roles, permissions } = await this.loadRolesAndPermissions(user.id);

    request.user = {
      id: user.id,
      publicId: user.publicId,
      userType: user.userType,
      email: user.email,
      organizationId: user.organizationId,
      roles,
      permissions,
    };
    return true;
  }

  /**
   * Loads the user's role codes and the union of permission codes those
   * roles grant. Two small indexed queries; for now this runs per request.
   * Data_Modeling_Complete.md A.9 suggests caching the resolved permission
   * set with the session later — that's an optimisation, not needed yet.
   */
  private async loadRolesAndPermissions(userId: string): Promise<{ roles: string[]; permissions: string[] }> {
    const roleRows = await this.dataSource
      .getRepository(UserRoleEntity)
      .createQueryBuilder('userRole')
      .innerJoin(RoleEntity, 'role', 'role.id = userRole.roleId')
      .where('userRole.userId = :userId', { userId })
      .select('role.code', 'code')
      .getRawMany<{ code: string }>();
    const roles = roleRows.map((row) => row.code);

    const permissionRows = await this.dataSource
      .getRepository(UserRoleEntity)
      .createQueryBuilder('userRole')
      .innerJoin(RolePermissionEntity, 'rolePermission', 'rolePermission.roleId = userRole.roleId')
      .innerJoin(PermissionEntity, 'permission', 'permission.id = rolePermission.permissionId')
      .where('userRole.userId = :userId', { userId })
      .select('permission.code', 'code')
      .distinct(true)
      .getRawMany<{ code: string }>();
    const permissions = permissionRows.map((row) => row.code);

    return { roles, permissions };
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, value] = header.split(' ');
    if (scheme !== 'Bearer' || !value) {
      return null;
    }
    return value;
  }
}
