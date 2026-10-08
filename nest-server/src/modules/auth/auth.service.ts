import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RolePermission } from '../../database/entities/role-permission.entity.js';
import { User } from '../../database/entities/user.entity.js';
import { UserRole } from '../../database/entities/user-role.entity.js';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './jwt-payload.interface.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// A valid bcrypt hash of an arbitrary, unused value — not a real user's
// password hash. Used only to give the "no such user" and "inactive
// account" paths in validateCredentials() the same bcrypt.compare cost as
// the real "wrong password" path, so response timing doesn't reveal
// whether an email is registered. The underlying plaintext is irrelevant;
// this hash is never meant to match any real input.
const DUMMY_PASSWORD_HASH =
  '$2b$12$CwTycUXWue0Thq9StjUM0uJ8vMwkhHjN0DMx1k8dX3SRwKEUH8Rfy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Verifies credentials for an ACTIVE user. Returns the hydrated
  // AuthenticatedUser (with roles/permissions) on success. Throws
  // UnauthorizedException on any failure — never distinguish "no such
  // email" from "wrong password" in the response, to avoid leaking which
  // emails are registered.
  //
  // Timing: a dummy bcrypt.compare runs on the not-found path too (see
  // DUMMY_PASSWORD_HASH below), so a missing user and a wrong password
  // take roughly the same time. Without this, an attacker could
  // enumerate registered emails by measuring response time, since
  // bcrypt.compare is deliberately slow and would otherwise only run
  // when a user actually exists.
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('lower(user.email) = :email', { email: normalizedEmail })
      .getOne();

    if (!user) {
      this.logger.warn(`Login attempt for unknown email`);
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      this.logger.warn(`Login attempt for inactive user ${user.id}`);
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Account is not active');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      this.logger.warn(`Failed login attempt for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    return this.toAuthenticatedUser(user);
  }

  // Loads role codes and permission codes for a user via the junction
  // tables — User/Role entities have no inverse relations by design (see
  // user-role.entity.ts), so this is done with explicit queries rather
  // than entity-graph traversal.
  async getRolesAndPermissions(
    userId: string,
  ): Promise<{ roles: string[]; permissions: string[] }> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });
    const roles = userRoles.map((userRole) => userRole.role.code);
    const roleIds = userRoles.map((userRole) => userRole.roleId);

    if (roleIds.length === 0) {
      return { roles, permissions: [] };
    }

    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rolePermission')
      .innerJoinAndSelect('rolePermission.permission', 'permission')
      .where('rolePermission.roleId IN (:...roleIds)', { roleIds })
      .getMany();
    const permissions = [
      ...new Set(
        rolePermissions.map((rolePermission) => rolePermission.permission.code),
      ),
    ];

    return { roles, permissions };
  }

  async toAuthenticatedUser(user: User): Promise<AuthenticatedUser> {
    const { roles, permissions } = await this.getRolesAndPermissions(user.id);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
    };
  }

  issueTokenPair(authenticatedUser: AuthenticatedUser): TokenPair {
    const accessPayload: AccessTokenPayload = {
      sub: authenticatedUser.id,
      email: authenticatedUser.email,
      roles: authenticatedUser.roles,
      permissions: authenticatedUser.permissions,
      type: 'access',
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: authenticatedUser.id,
      type: 'refresh',
    };

    // expiresIn is cast via `as never` — jsonwebtoken@9's types narrow it
    // to a `StringValue` template-literal union (e.g. '15m'); our config
    // values are always valid duration strings (see jwt.config.ts).
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'jwt.accessExpiresIn',
      ) as never,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<string>(
        'jwt.refreshExpiresIn',
      ) as never,
    });

    return { accessToken, refreshToken };
  }

  // Verifies a refresh token and re-issues a fresh token pair (rotation),
  // re-reading the user's current roles/permissions/status rather than
  // trusting stale claims from the refresh token itself.
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const authenticatedUser = await this.toAuthenticatedUser(user);
    return this.issueTokenPair(authenticatedUser);
  }
}
