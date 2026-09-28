import { createHash, randomBytes, randomUUID } from 'crypto';
import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { DataSource, QueryFailedError } from 'typeorm';
import type { AppConfig } from '../../config/app.config.js';
import { BuyerProfileEntity } from '../identity/entities/buyer-profile.entity.js';
import { RoleEntity } from '../identity/entities/role.entity.js';
import { UserRoleEntity } from '../identity/entities/user-role.entity.js';
import { UserTokenEntity } from '../identity/entities/user-token.entity.js';
import { UserEntity } from '../identity/entities/user.entity.js';
import type { RegisterBuyerDto } from './dto/register-buyer.dto.js';
import type { RegisterBuyerResponseDto } from './dto/register-buyer-response.dto.js';

const EMAIL_VERIFY_TOKEN_BYTES = 32; // 256 bits, matches typical session-token entropy
const EMAIL_VERIFY_EXPIRY_HOURS = 1; // Data_Modeling_Complete.md Part 2.7: "Reset: 1 hour"

/**
 * Buyer registration (Data_Modeling_Complete.md Part 12.2, "Buyer
 * registration — John signs up"). Writes users + buyer_profile + user_role
 * + user_token in one transaction, exactly as the flow specifies — no
 * partial state (e.g. a users row with no role) can ever be left behind by
 * a mid-write failure.
 *
 * Login, JWT issuance, and email verification (POST /auth/verify-email)
 * are separate endpoints, not built in this pass — see AuthModule's doc
 * comment.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly isDev: boolean;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.isDev = this.configService.get<AppConfig>('app')!.isDev;
  }

  async registerBuyer(dto: RegisterBuyerDto): Promise<RegisterBuyerResponseDto> {
    const email = dto.email.toLowerCase();

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
      throw error;
    }

    // Dev-only: print the raw verification token so it can be exercised
    // locally without an email provider. Never logged in production — the
    // token is equivalent to a password-reset link, see security-rules.md
    // on not logging credentials/tokens. Real email delivery is a stated
    // follow-up (AuthModule doc comment), not stubbed here.
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

  /** True if `error` is a Postgres unique-constraint violation (SQLSTATE 23505). */
  private isUniqueViolation(error: unknown): boolean {
    return error instanceof QueryFailedError && (error as { code?: string }).code === '23505';
  }
}
