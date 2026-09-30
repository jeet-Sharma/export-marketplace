import { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'crypto';
import type { DataSource } from 'typeorm';
import { AuthService } from './auth.service.js';
import { UserTokenEntity } from '../identity/entities/user-token.entity.js';
import type { EmailService } from '../email/email.service.js';

type QueryBuilder = {
  setLock: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  andWhere: ReturnType<typeof vi.fn>;
  getOne: ReturnType<typeof vi.fn>;
};

function createQueryBuilder(result: unknown): QueryBuilder {
  const builder: QueryBuilder = {
    setLock: vi.fn(),
    where: vi.fn(),
    andWhere: vi.fn(),
    getOne: vi.fn().mockResolvedValue(result),
  };
  builder.setLock.mockReturnValue(builder);
  builder.where.mockReturnValue(builder);
  builder.andWhere = vi.fn().mockReturnValue(builder);
  return builder;
}

describe('AuthService.verifyEmail', () => {
  let service: AuthService;
  let tokenSave: ReturnType<typeof vi.fn>;
  let userSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tokenSave = vi.fn().mockResolvedValue(undefined);
    userSave = vi.fn().mockResolvedValue(undefined);
  });

  it('marks a valid buyer token used and activates the buyer atomically', async () => {
    const rawToken = 'a'.repeat(64);
    const token = {
      userId: '42',
      tokenType: 'EMAIL_VERIFY',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const user = { userType: 'BUYER', status: 'PENDING', emailVerified: false };
    const tokenBuilder = createQueryBuilder(token);
    const userBuilder = createQueryBuilder(user);
    const tokenRepository = { createQueryBuilder: vi.fn(() => tokenBuilder), save: tokenSave };
    const userRepository = { createQueryBuilder: vi.fn(() => userBuilder), save: userSave };
    const manager = {
      getRepository: vi.fn((entity: unknown) => (entity === UserTokenEntity ? tokenRepository : userRepository)),
    };
    const dataSource = {
      transaction: vi.fn(async (callback: (transactionManager: typeof manager) => Promise<void>) => callback(manager)),
    } as unknown as DataSource;

    service = new AuthService(
      dataSource,
      new ConfigService({ app: { isDev: true } }),
      { sendVerificationEmail: vi.fn().mockResolvedValue(undefined) } as unknown as EmailService,
      { signAsync: vi.fn() } as unknown as JwtService,
    );

    await expect(service.verifyEmail(rawToken)).resolves.toEqual({ message: 'Email verified successfully.' });

    expect(token.usedAt).toBeInstanceOf(Date);
    expect(user.emailVerified).toBe(true);
    expect(user.status).toBe('ACTIVE');
    expect(tokenSave).toHaveBeenCalledWith(token);
    expect(userSave).toHaveBeenCalledWith(user);
    expect(dataSource.transaction).toHaveBeenCalledOnce();
  });

  it('rejects an unknown token without changing any user', async () => {
    const tokenBuilder = createQueryBuilder(null);
    const userSave = vi.fn();
    const manager = {
      getRepository: vi.fn(() => ({ createQueryBuilder: vi.fn(() => tokenBuilder), save: userSave })),
    };
    const dataSource = {
      transaction: vi.fn(async (callback: (transactionManager: typeof manager) => Promise<void>) => callback(manager)),
    } as unknown as DataSource;
    service = new AuthService(
      dataSource,
      new ConfigService({ app: { isDev: false } }),
      { sendVerificationEmail: vi.fn().mockResolvedValue(undefined) } as unknown as EmailService,
      { signAsync: vi.fn() } as unknown as JwtService,
    );

    await expect(service.verifyEmail('b'.repeat(64))).rejects.toThrow('invalid or expired');
    expect(userSave).not.toHaveBeenCalled();
    expect(createHash('sha256').update('b'.repeat(64)).digest('hex')).toHaveLength(64);
  });
});
