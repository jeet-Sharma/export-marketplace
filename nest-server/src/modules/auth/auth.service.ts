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
import type { RefreshTokenPayload } from './auth.types.js';

const EMAIL_VERIFY_TOKEN_BYTES = 32; // 256 bits, matches typical session-token entropy
const EMAIL_VERIFY_EXPIRY_HOURS = 1; // Data_Modeling_Complete.md Part 2.7: "Reset: 1 hour"
// Minimum gap between verification emails for one account. Since
// /auth/resend-verification is unauthenticated (anyone who knows a pending
// buyer's email can call it), this per-account cooldown is what stops an
// attacker from spamming mail, invalidating the buyer's link repeatedly, and
// piling up token rows. Measured against the most recent EMAIL_VERIFY
// token's created_at.
const RESEND_COOLDOWN_SECONDS = 60;

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
  // Computed once, on first login, then cached. Used only to spend argon2
  // time on rejected logins so response latency doesn't reveal whether an
  // account exists — never a real credential, so it isn't a secret.
  private dummyPasswordHash: Promise<string> | null = null;

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

      const now = new Date();
      // A login is only eligible to proceed to password verification if the
      // account is an active, verified buyer that isn't locked and has a
      // password set. All other cases are rejected identically.
      const eligible =
        !!user &&
        user.userType === 'BUYER' &&
        user.status === 'ACTIVE' &&
        user.emailVerified &&
        !!user.passwordHash &&
        !(user.lockedUntil && user.lockedUntil > now);

      // Always run one argon2.verify, regardless of eligibility. For an
      // ineligible/absent account we verify the submitted password against a
      // fixed dummy hash so the response takes comparable time to a real
      // check — otherwise the fast early-return on missing/inactive accounts
      // would let an attacker distinguish active buyer accounts by latency.
      const hashToCheck = eligible ? user!.passwordHash! : await this.getDummyPasswordHash();
      const passwordValid = await argon2.verify(hashToCheck, dto.password);

      if (!eligible || !user) {
        return null;
      }

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

    return this.signTokenPair({
      userId: session.user.id,
      publicId: session.user.publicId,
      userType: session.user.userType,
      sessionId: session.sessionId,
      refreshTokenId: session.refreshTokenId,
    });
  }

  /**
   * Exchange a valid refresh token for a fresh access + refresh token pair.
   *
   * Refresh tokens are ROTATED: each successful refresh revokes the session
   * row the presented token belonged to and issues a brand-new session +
   * token pair. So a refresh token is single-use — if a stolen one is
   * replayed after the legitimate client already refreshed, its session is
   * already revoked and the replay is rejected.
   */
  async refreshTokens(refreshToken: string): Promise<LoginResponseDto> {
    if (!this.authConfig.accessSecret || !this.authConfig.refreshSecret) {
      throw new ServiceUnavailableException('Authentication is not configured.');
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.authConfig.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
    if (payload.type !== 'refresh' || !payload.sessionId || !payload.jti) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const presentedHash = createHash('sha256').update(payload.jti).digest('hex');

    const rotated = await this.dataSource.transaction(async (manager) => {
      // Lock the owning user row FIRST. This is the shared anchor that
      // serializes rotation against logoutAll: rotation inserts a brand-new
      // session row that a concurrent bulk "revoke all live sessions" UPDATE
      // can't see until this transaction commits, so without a common lock
      // logoutAll could complete between our insert and commit and leave the
      // freshly-minted session alive. Both paths take this same user lock
      // before touching auth_session, so they can never interleave.
      const lockUser = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id: payload.sub })
        .getOne();
      if (!lockUser) {
        return null;
      }

      // Lock the session row so a concurrent replay of the same refresh
      // token can't both pass validation before either revokes it.
      const session = await manager
        .getRepository(AuthSessionEntity)
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :id', { id: payload.sessionId })
        .getOne();

      const now = new Date();
      // Reject if the session is missing, already revoked, expired, or its
      // stored hash doesn't match the presented token. Constant response.
      if (
        !session ||
        session.revokedAt ||
        session.expiresAt.getTime() <= now.getTime() ||
        session.refreshTokenHash !== presentedHash ||
        session.userId !== payload.sub
      ) {
        return null;
      }

      // Reuse the already-locked user row (session.userId === payload.sub,
      // verified just above). No second read needed.
      const user = lockUser;
      if (user.status !== 'ACTIVE') {
        return null;
      }

      // Rotate: revoke the presented session (superseded, not a logout)...
      session.revokedAt = now;
      session.revokedReason = 'ROTATED';
      session.lastUsedAt = now;
      await manager.getRepository(AuthSessionEntity).save(session);

      // ...and mint a fresh one.
      const refreshTokenId = randomUUID();
      const newSession = await manager.getRepository(AuthSessionEntity).save(
        manager.getRepository(AuthSessionEntity).create({
          userId: user.id,
          refreshTokenHash: createHash('sha256').update(refreshTokenId).digest('hex'),
          userAgent: session.userAgent,
          ip: session.ip,
          expiresAt: new Date(Date.now() + this.authConfig.refreshTokenTtlSeconds * 1000),
          revokedAt: null,
          revokedReason: null,
        }),
      );

      return { user, sessionId: newSession.id, refreshTokenId };
    });

    if (!rotated) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    return this.signTokenPair({
      userId: rotated.user.id,
      publicId: rotated.user.publicId,
      userType: rotated.user.userType,
      sessionId: rotated.sessionId,
      refreshTokenId: rotated.refreshTokenId,
    });
  }

  /**
   * Signs an access token + refresh token for an already-persisted session.
   * Shared by login and refresh so the token shape stays identical in both.
   */
  private async signTokenPair(input: {
    userId: string;
    publicId: string;
    userType: 'PLATFORM' | 'VENDOR' | 'BUYER';
    sessionId: string;
    refreshTokenId: string;
  }): Promise<LoginResponseDto> {
    const accessToken = await this.jwtService.signAsync(
      { sub: input.userId, publicId: input.publicId, userType: input.userType, type: 'access' },
      { secret: this.authConfig.accessSecret, expiresIn: this.authConfig.accessTokenTtlSeconds },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: input.userId, sessionId: input.sessionId, jti: input.refreshTokenId, type: 'refresh' },
      { secret: this.authConfig.refreshSecret, expiresIn: this.authConfig.refreshTokenTtlSeconds },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.authConfig.accessTokenTtlSeconds,
    };
  }

  /**
   * Log out one device: revoke the session the presented refresh token
   * belongs to. Deliberately idempotent — an invalid, expired, forged, or
   * already-revoked token yields the same success response, so logout never
   * errors and never reveals whether the token was valid. After this, that
   * refresh token can't be rotated (its session is revoked); the matching
   * access token still works until it expires (short-lived by design).
   */
  async logout(refreshToken: string): Promise<{ message: string }> {
    const success = { message: 'Logged out.' };

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.authConfig.refreshSecret,
      });
    } catch {
      return success;
    }
    if (payload.type !== 'refresh' || !payload.sessionId || !payload.jti) {
      return success;
    }

    const presentedHash = createHash('sha256').update(payload.jti).digest('hex');
    await this.dataSource
      .getRepository(AuthSessionEntity)
      .createQueryBuilder()
      .update(AuthSessionEntity)
      .set({ revokedAt: new Date(), revokedReason: 'LOGOUT' })
      .where('id = :id', { id: payload.sessionId })
      .andWhere('user_id = :userId', { userId: payload.sub })
      .andWhere('refresh_token_hash = :hash', { hash: presentedHash })
      .andWhere('revoked_at IS NULL')
      .execute();

    return success;
  }

  /**
   * Log out of all devices: revoke every currently-live session for the
   * user. Called from a JwtAuthGuard-protected route, so the user id comes
   * from the verified access token, never from the request body.
   */
  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.dataSource.transaction(async (manager) => {
      // Lock the user row before revoking, using the SAME anchor
      // refreshTokens locks first. If a rotation is mid-flight, this blocks
      // until it commits (so its newly-inserted session is now visible and
      // gets revoked below); if this wins the lock, rotation blocks until we
      // commit, then sees the old session already revoked and mints nothing.
      // Either ordering leaves zero live sessions — no refreshed session can
      // slip past logout-all.
      await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :id', { id: userId })
        .getOne();

      await manager
        .getRepository(AuthSessionEntity)
        .createQueryBuilder()
        .update(AuthSessionEntity)
        .set({ revokedAt: new Date(), revokedReason: 'LOGOUT' })
        .where('user_id = :userId', { userId })
        .andWhere('revoked_at IS NULL')
        .execute();
    });

    return { message: 'Logged out of all devices.' };
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

    // The transaction has committed at this point, so the account already
    // exists. Send the verification email AFTER commit (sending before could
    // produce a link for a token that was rolled back). A delivery failure
    // must NOT fail the request: the account is real, and failing here would
    // strand the buyer — a retry hits the users_email_uq index and returns
    // 409, so they could neither log in nor re-register. Instead, log the
    // failure and let the buyer trigger a new email via
    // POST /auth/resend-verification, which is built for exactly this.
    try {
      await this.emailService.sendVerificationEmail({
        email: created.email,
        fullName: created.fullName,
        token: rawToken,
      });
    } catch (error) {
      this.logger.error(
        `Registration succeeded for ${created.email} but the verification email failed to send. ` +
        `The buyer can request a new one via /auth/resend-verification.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

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
    const genericResponse = { message: 'If an eligible account exists, a verification email has been sent.' };

    // Step 1: cheap unlocked eligibility read. Unknown, verified, blocked,
    // anonymised, and non-buyer accounts all return the same response to
    // prevent email-account enumeration, without opening a transaction.
    const candidate = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('user')
      .where('lower(user.email) = :email', { email })
      .getOne();
    if (!candidate || candidate.userType !== 'BUYER' || candidate.emailVerified || candidate.status !== 'PENDING') {
      return genericResponse;
    }

    const rawToken = randomBytes(EMAIL_VERIFY_TOKEN_BYTES).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // Step 2: reserve the send inside a transaction that LOCKS the user row
    // first. This serialises concurrent unauthenticated requests for the
    // same buyer: they queue on the lock, and the cooldown is re-checked
    // while the lock is held, so only ONE request per window passes and
    // persists a token. Doing the cooldown check unlocked (as before) let
    // every concurrent request pass it at once and flood the inbox.
    //
    // The new token is INSERTED but prior tokens are NOT invalidated here.
    // Keeping older unused tokens valid means a subsequent mail-send failure
    // (step 3) can never leave the buyer with a dead link — every issued
    // link stays usable until it is spent or expires. Tokens are single-use
    // and short-lived, so a few coexisting is harmless.
    const shouldSend = await this.dataSource.transaction(async (manager) => {
      const lockedUser = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId: candidate.id })
        .getOne();

      // Re-check eligibility on the LOCKED row. The step-1 read was
      // unlocked, so between then and now verifyEmail could have activated
      // this buyer (or an admin blocked them). Without this re-check we'd
      // store and email a token for an already-active account, which
      // verification then rejects — handing the buyer a dead link. Bail out
      // (same generic response) if the account is no longer an eligible
      // pending buyer.
      if (
        !lockedUser ||
        lockedUser.userType !== 'BUYER' ||
        lockedUser.emailVerified ||
        lockedUser.status !== 'PENDING'
      ) {
        return false;
      }

      const mostRecentToken = await manager
        .getRepository(UserTokenEntity)
        .createQueryBuilder('token')
        .where('token.userId = :userId', { userId: candidate.id })
        .andWhere('token.tokenType = :tokenType', { tokenType: 'EMAIL_VERIFY' })
        .orderBy('token.createdAt', 'DESC')
        .getOne();

      // Cooldown, now evaluated under the lock so it is race-safe.
      if (mostRecentToken && Date.now() - mostRecentToken.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
        return false;
      }

      await manager.getRepository(UserTokenEntity).save(
        manager.getRepository(UserTokenEntity).create({
          userId: candidate.id,
          tokenType: 'EMAIL_VERIFY',
          tokenHash,
          expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000),
        }),
      );
      return true;
    });

    // Throttled by the cooldown — same generic response, nothing sent.
    if (!shouldSend) {
      return genericResponse;
    }

    // Step 3: send after commit. A failure here leaves the just-persisted
    // token (and any earlier valid ones) usable, so the buyer is never
    // stranded; it just means this particular email didn't arrive. The
    // cooldown row is already committed, which also prevents a failed send
    // from being retried into a flood.
    try {
      await this.emailService.sendVerificationEmail({
        email: candidate.email,
        fullName: candidate.fullName,
        token: rawToken,
      });
    } catch (error) {
      this.logger.error(
        `Resend verification email failed for ${candidate.email}; the token was persisted and remains valid.`,
        error instanceof Error ? error.stack : undefined,
      );
      return genericResponse;
    }

    if (this.isDev) {
      this.logger.log(`[dev only] Email verification token for ${candidate.email}: ${rawToken}`);
    }

    return genericResponse;
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invalidToken = new BadRequestException('The verification token is invalid or expired.');

    await this.dataSource.transaction(async (manager) => {
      // Consistent lock order across all auth flows: ALWAYS lock the user row
      // before locking/mutating that user's token rows. resendVerification
      // does the same (user first, then tokens). Locking token-then-user
      // here would let two concurrent requests for the same buyer each hold
      // the row the other needs, and PostgreSQL would abort one on deadlock.
      //
      // verifyEmail is entered with only a token, not a user id, so first
      // read the token WITHOUT a lock just to discover its owner...
      const tokenLookup = await manager
        .getRepository(UserTokenEntity)
        .createQueryBuilder('token')
        .where('token.tokenHash = :tokenHash', { tokenHash })
        .andWhere('token.tokenType = :tokenType', { tokenType: 'EMAIL_VERIFY' })
        .getOne();

      // Keep invalid/expired/already-used tokens indistinguishable so the
      // endpoint never reveals whether a token existed or was consumed.
      if (!tokenLookup) {
        throw invalidToken;
      }

      // ...then lock the user FIRST (the consistent ordering root)...
      const user = await manager
        .getRepository(UserEntity)
        .createQueryBuilder('user')
        .setLock('pessimistic_write')
        .where('user.id = :userId', { userId: tokenLookup.userId })
        .getOne();

      // ...and only then lock the token row and re-read its live state, so
      // every mutating decision below is made while BOTH locks are held.
      const tokenRow = await manager
        .getRepository(UserTokenEntity)
        .createQueryBuilder('token')
        .setLock('pessimistic_write')
        .where('token.id = :id', { id: tokenLookup.id })
        .getOne();

      if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt.getTime() <= Date.now()) {
        throw invalidToken;
      }

      if (!user || user.userType !== 'BUYER' || user.status === 'ANONYMISED' || user.status === 'BLOCKED') {
        throw invalidToken;
      }

      if (user.emailVerified && user.status === 'ACTIVE') {
        throw invalidToken;
      }

      tokenRow.usedAt = new Date();
      await manager.getRepository(UserTokenEntity).save(tokenRow);

      user.emailVerified = true;
      user.status = 'ACTIVE';
      await manager.getRepository(UserEntity).save(user);
    });

    return { message: 'Email verified successfully.' };
  }

  /**
   * A cached argon2 hash of a random throwaway value, used to spend
   * comparable CPU time on logins for accounts that can't actually log in,
   * so those requests don't return noticeably faster than a real password
   * check (see loginBuyer). Computed once and reused.
   */
  private getDummyPasswordHash(): Promise<string> {
    if (!this.dummyPasswordHash) {
      this.dummyPasswordHash = argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id });
    }
    return this.dummyPasswordHash;
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
