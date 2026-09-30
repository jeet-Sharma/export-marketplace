import { createHash, randomBytes, randomUUID } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DataSource, QueryFailedError } from 'typeorm';
import type { AppConfig } from '../../config/app.config.js';
import type { AuthConfig } from '../../config/auth.config.js';
import { AuthSessionEntity } from '../identity/entities/auth-session.entity.js';
import { BuyerProfileEntity } from '../identity/entities/buyer-profile.entity.js';
import { RoleEntity } from '../identity/entities/role.entity.js';
import { UserRoleEntity } from '../identity/entities/user-role.entity.js';
import { UserTokenEntity } from '../identity/entities/user-token.entity.js';
import { UserEntity } from '../identity/entities/user.entity.js';
import { EmailService } from '../email/email.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { LoginResponseDto } from './dto/login-response.dto.js';
import type { RegisterBuyerDto } from './dto/register-buyer.dto.js';
import type { RegisterBuyerResponseDto } from './dto/register-buyer-response.dto.js';

const EMAIL_VERIFY_TOKEN_BYTES = 32; // 256 bits, matches typical session-token entropy
const EMAIL_VERIFY_EXPIRY_HOURS = 1; // Data_Modeling_Complete.md Part 2.7: "Reset: 1 hour"

/**
 * Buyer registration, email verification, resend verification, and login
 * are implemented. Session refresh/logout and request guards remain separate
 * endpoints.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isDev: boolean;
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) {
    this.isDev = this.configService.get<AppConfig>('app')!.isDev;
    this.authConfig = this.configService.get<AuthConfig>('auth') ?? {
      accessSecret: '',
      refreshSecret: '',
      accessTokenTtlSeconds: 900,
      refreshTokenTtlSeconds: 2592000,
      maxFailedLogins: 5,
      lockoutMinutes: 15,
    };
  }

  async loginBuyer(dto: LoginDto): Promise<LoginResponseDto> {
    if (!this.authConfig.accessSecret || !this.authConfig.refreshSecret) {
      throw new ServiceUnavailableException('Authentication is not configured.');
    }

    const email = dto.email.toLowerCase();
    const session = await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('lower(user.email) = :email', { email })
        .getOne();

      if (!user || user.userType !== 'BUYER') {
        return null;
      }

      const now = new Date();
      if (user.lockedUntil && user.lockedUntil > now) {
        return null;
      }

      if (user.status !== 'ACTIVE' || !user.emailVerified || !user.passwordHash) {
        return null;
      }

      const passwordValid = await argon2.verify(user.passwordHash, dto.password);
      if (!passwordValid) {
        user.failedLoginCount += 1;
        if (user.failedLoginCount >= this.authConfig.maxFailedLogins) {
          user.lockedUntil = new Date(Date.now() + this.authConfig.lockoutMinutes * 60 * 1000);
        }
        await manager.getRepository(UserEntity).save(user);
        return null;
      }

      user.failedLoginCount = 0;
      user.lockedUntil = null;
      user.lastLoginAt = now;
      await manager.getRepository(UserEntity).save(user);

      const refreshTokenId = randomUUID();
      const refreshTokenHash = createHash('sha256').update(refreshTokenId).digest('hex');
      const sessionExpiresAt = new Date(Date.now() + this.authConfig.refreshTokenTtlSeconds * 1000);
      const savedSession = await manager.getRepository(AuthSessionEntity).save(
        manager.getRepository(AuthSessionEntity).create({
          userId: user.id,
          refreshTokenHash,
          userAgent: null,
          ip: null,
          expiresAt: sessionExpiresAt,
          revokedAt: null,
          revokedReason: null,
        }),
      );

      return {
        user,
        sessionId: savedSession.id,
        refreshTokenId,
      };
    });

    if (!session) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload = {
      sub: session.user.id,
      publicId: session.user.publicId,
      userType: session.user.userType,
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.authConfig.accessSecret,
      expiresIn: this.authConfig.accessTokenTtlSeconds,
    });
    const refreshToken = await this.jwtService.signAsync(
      { sub: session.user.id, sessionId: session.sessionId, jti: session.refreshTokenId, type: 'refresh' },
      {
        secret: this.authConfig.refreshSecret,
        expiresIn: this.authConfig.refreshTokenTtlSeconds,
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.authConfig.accessTokenTtlSeconds,
    };
  }

  async registerBuyer(dto: RegisterBuyerDto): Promise<RegisterBuyerResponseDto> {
    const email = dto.email.toLowerCase();

    // Registration creates only pending accounts. Verification is a separate,
    // single-use transaction so a copied or replayed link cannot activate an
    // account twice.

    // Argon2id (the doc's own stated default — Part 2.5's password_hash
    // comment: "argon2id / bcrypt") with the library's recommended
    // defaults. Hashing happens before the transaction opens: it is CPU-bound
    // and holds no locks, so there is no reason to do it while a DB
    // connection is checked out.
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    // SHA-256, not argon2, for the token hash: unlike a password, this
    // value is already a 256-bit cryptographically random string, so it
    // carries no brute-forceable structure for argon2's memory-hardness to
    // defend against. A fast hash is correct here and keeps the lookup in
    // POST /auth/verify-email (a future endpoint) cheap.
    const rawToken = randomBytes(EMAIL_VERIFY_TOKEN_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    let created: UserEntity;
    try {
      created = await this.dataSource.transaction(async (manager) => {
        const buyerRole = await manager.getRepository(RoleEntity).findOne({ where: { code: 'BUYER' } });
        if (!buyerRole) {
          // Should never happen outside a broken/rolled-back migration state
          // (see SeedBuyerRole migration) — surfaced as a clean 500 rather
          // than leaking "role table is empty" to the client.
          throw new InternalServerErrorException('Registration is temporarily unavailable.');
        }

        // No separate "check email exists, then insert" step: that would be
        // a race (two concurrent signups for the same email could both pass
        // the check before either commits). The users_email_uq index
        // (lower(email)) is the actual guard — a duplicate simply fails this
        // insert, and the catch block below translates that into a clean
        // 409 instead of leaking the raw DB error (api-rules.md).
        const user = await manager.getRepository(UserEntity).save(
          manager.getRepository(UserEntity).create({
            publicId: randomUUID(),
            userType: 'BUYER',
            organizationId: null,
            fullName: dto.fullName,
            email,
            passwordHash,
            authProvider: 'LOCAL',
            emailVerified: false,
            status: 'PENDING',
          }),
        );

        await manager.getRepository(BuyerProfileEntity).save(
          manager.getRepository(BuyerProfileEntity).create({
            userId: user.id,
            buyerType: 'INDIVIDUAL',
            country: dto.country ?? null,
            preferredCurrency: dto.preferredCurrency ?? null,
          }),
        );

        await manager.getRepository(UserRoleEntity).save(
          manager.getRepository(UserRoleEntity).create({
            userId: user.id,
            roleId: buyerRole.id,
            assignedBy: null, // self-registration — nobody "assigned" the role
          }),
        );

        await manager.getRepository(UserTokenEntity).save(
          manager.getRepository(UserTokenEntity).create({
            userId: user.id,
            tokenType: 'EMAIL_VERIFY',
            tokenHash,
            expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000),
          }),
        );

        return user;
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('An account with this email already exists.');
      }
      // A foreign-key violation here means the submitted country or currency
      // code passed DTO format validation but does not exist in the
      // reference tables (which are unseeded today). Return a clean 400
      // rather than leaking the raw Postgres error.
      if (this.isForeignKeyViolation(error)) {
        throw new BadRequestException('The provided country or currency code is not supported.');
      }
      // A deliberate HttpException raised inside the transaction (e.g. the
      // missing-BUYER-role 500) is already client-safe — pass it through.
      if (error instanceof HttpException) {
        throw error;
      }
      // Any other database/driver failure is logged server-side and surfaced
      // as a generic 500, so no raw error detail reaches the client.
      this.logger.error('Buyer registration failed.', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Registration could not be completed. Please try again.');
    }

    // The transaction has committed at this point. Only now hand the raw
    // token to the email provider; sending before commit could create an
    // email link for a token that was rolled back and never became usable.
    await this.emailService.sendVerificationEmail({
      email: created.email,
      fullName: created.fullName,
      token: rawToken,
    });

    // Dev-only fallback for local testing. Production never logs the raw
    // token; it exists only in the verification email link.
    if (this.isDev) {
      // logger.log, not logger.debug: Nest's default logger only prints
      // "log"/"warn"/"error"/"fatal" unless debug/verbose levels are
      // explicitly enabled (main.ts doesn't enable them), so debug() here
      // would have silently printed nothing in exactly the dev scenario
      // this is meant for.
      this.logger.log(`[dev only] Email verification token for ${email}: ${rawToken}`);
    }

    return {
      id: created.id,
      fullName: created.fullName,
      email: created.email,
      status: 'PENDING',
    };
  }

  async resendVerification(emailInput: string): Promise<{ message: string }> {
    const email = emailInput.toLowerCase();
    const rawToken = randomBytes(EMAIL_VERIFY_TOKEN_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const pendingBuyer = await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('lower(user.email) = :email', { email })
        .getOne();

      // Return the same response for unknown, active, blocked, anonymised,
      // and non-buyer accounts. This prevents email-account enumeration.
      if (!user || user.userType !== 'BUYER' || user.emailVerified || user.status !== 'PENDING') {
        return null;
      }

      const now = new Date();
      await manager
        .getRepository(UserTokenEntity)
        .createQueryBuilder()
        .update(UserTokenEntity)
        .set({ usedAt: now })
        .where('user_id = :userId', { userId: user.id })
        .andWhere('token_type = :tokenType', { tokenType: 'EMAIL_VERIFY' })
        .andWhere('used_at IS NULL')
        .execute();

      await manager.getRepository(UserTokenEntity).save(
        manager.getRepository(UserTokenEntity).create({
          userId: user.id,
          tokenType: 'EMAIL_VERIFY',
          tokenHash,
          expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000),
        }),
      );

      return { email: user.email, fullName: user.fullName };
    });

    if (pendingBuyer) {
      // The replacement token is sent only after the transaction commits.
      await this.emailService.sendVerificationEmail({
        email: pendingBuyer.email,
        fullName: pendingBuyer.fullName,
        token: rawToken,
      });

      if (this.isDev) {
        this.logger.log(`[dev only] Email verification token for ${pendingBuyer.email}: ${rawToken}`);
      }
    }

    return { message: 'If an eligible account exists, a verification email has been sent.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await this.dataSource.transaction(async (manager) => {
      const tokenRow = await manager
        .getRepository(UserTokenEntity)
        .createQueryBuilder('token')
        .setLock('pessimistic_write')
        .where('token.tokenHash = :tokenHash', { tokenHash })
        .andWhere('token.tokenType = :tokenType', { tokenType: 'EMAIL_VERIFY' })
        .getOne();

      // Keep invalid, expired, and already-used tokens indistinguishable.
      // This prevents the endpoint from revealing whether a token ever
      // existed or has already been consumed.
      if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('The verification token is invalid or expired.');
      }

      const user = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId: tokenRow.userId })
        .getOne();

      if (!user || user.userType !== 'BUYER' || user.status === 'ANONYMISED' || user.status === 'BLOCKED') {
        throw new BadRequestException('The verification token is invalid or expired.');
      }

      if (user.emailVerified && user.status === 'ACTIVE') {
        throw new BadRequestException('The verification token is invalid or expired.');
      }

      tokenRow.usedAt = new Date();
      await manager.getRepository(UserTokenEntity).save(tokenRow);

      user.emailVerified = true;
      user.status = 'ACTIVE';
      await manager.getRepository(UserEntity).save(user);
    });

    return { message: 'Email verified successfully.' };
  }

  /** True if `error` is a Postgres unique-constraint violation (SQLSTATE 23505). */
  private isUniqueViolation(error: unknown): boolean {
    return error instanceof QueryFailedError && (error as { code?: string }).code === '23505';
  }

  /** True if `error` is a Postgres foreign-key violation (SQLSTATE 23503). */
  private isForeignKeyViolation(error: unknown): boolean {
    return error instanceof QueryFailedError && (error as { code?: string }).code === '23503';
  }
}
