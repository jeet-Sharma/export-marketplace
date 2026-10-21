import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';

/**
 * Unit tests for JwtAuthGuard — the guard that populates req.user for
 * every catalog/inventory route (previously an unenforced contract, see
 * request-context.type.ts). JwtService/ConfigService/DataSource are
 * hand-mocked; the actual token signing/verification cryptography is
 * @nestjs/jwt's own concern, not re-tested here — this exercises the
 * guard's own logic: token extraction, the account-status gate, and how
 * the verified principal is shaped into RequestContext.
 */
describe('JwtAuthGuard', () => {
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };
  let configService: { get: ReturnType<typeof vi.fn> };
  let userRepository: { findOne: ReturnType<typeof vi.fn> };
  let userRoleQueryBuilder: {
    innerJoinAndSelect: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    getMany: ReturnType<typeof vi.fn>;
  };
  let userRoleRepository: { createQueryBuilder: ReturnType<typeof vi.fn> };
  let organizationRepository: { findOne: ReturnType<typeof vi.fn> };
  let dataSource: { getRepository: ReturnType<typeof vi.fn> };
  let guard: JwtAuthGuard;

  function makeContext(headers: Record<string, string>) {
    const request: { headers: Record<string, string>; user?: unknown } = { headers };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      request,
    };
  }

  beforeEach(() => {
    jwtService = { verifyAsync: vi.fn() };
    configService = {
      get: vi.fn().mockReturnValue({
        accessSecret: 'test-secret',
        refreshSecret: 'test-refresh-secret',
        accessTokenTtlSeconds: 900,
        refreshTokenTtlSeconds: 2592000,
        maxFailedLogins: 5,
        lockoutMinutes: 15,
      }),
    };
    userRepository = {
      findOne: vi.fn().mockResolvedValue({
        id: 'user-1',
        organizationId: 'org-a',
        userType: 'VENDOR',
        status: 'ACTIVE',
      }),
    };
    userRoleQueryBuilder = {
      innerJoinAndSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([{ role: { code: 'VENDOR_CHECKER' } }]),
    };
    userRoleRepository = { createQueryBuilder: vi.fn(() => userRoleQueryBuilder) };
    // Default: the vendor's organization is APPROVED (active), matching
    // the default userRepository mock above (organizationId: 'org-a').
    organizationRepository = { findOne: vi.fn().mockResolvedValue({ id: 'org-a', status: 'APPROVED' }) };
    dataSource = {
      getRepository: vi.fn((entity: { name?: string }) => {
        if (entity?.name === 'UserRoleEntity') return userRoleRepository;
        if (entity?.name === 'OrganizationEntity') return organizationRepository;
        return userRepository;
      }),
    };

    guard = new JwtAuthGuard(jwtService as never, configService as never, dataSource as never);
  });

  it('throws UnauthorizedException when no Authorization header is present', async () => {
    const context = makeContext({});

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the Authorization header is not a Bearer token', async () => {
    const context = makeContext({ authorization: 'Basic abc123' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when auth is not configured (no accessSecret)', async () => {
    configService.get.mockReturnValue({ accessSecret: '', refreshSecret: '' });
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the token fails verification', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    const context = makeContext({ authorization: 'Bearer badtoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the token is valid but the user no longer exists', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-404', publicId: 'pid', userType: 'VENDOR' });
    userRepository.findOne.mockResolvedValue(null);
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user is BLOCKED', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', publicId: 'pid', userType: 'VENDOR' });
    userRepository.findOne.mockResolvedValue({ id: 'user-1', organizationId: 'org-a', status: 'BLOCKED' });
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user is ANONYMISED', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', publicId: 'pid', userType: 'VENDOR' });
    userRepository.findOne.mockResolvedValue({ id: 'user-1', organizationId: 'org-a', status: 'ANONYMISED' });
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user\'s organization is SUSPENDED', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', publicId: 'pid', userType: 'VENDOR' });
    organizationRepository.findOne.mockResolvedValue({ id: 'org-a', status: 'SUSPENDED' });
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user\'s organization is BLOCKED', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', publicId: 'pid', userType: 'VENDOR' });
    organizationRepository.findOne.mockResolvedValue({ id: 'org-a', status: 'BLOCKED' });
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the user\'s organization no longer exists', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', publicId: 'pid', userType: 'VENDOR' });
    organizationRepository.findOne.mockResolvedValue(null);
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await expect(guard.canActivate(context as never)).rejects.toThrow(UnauthorizedException);
  });

  it('does not check organization status for a buyer (organizationId null)', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-2', publicId: 'pid', userType: 'BUYER' });
    userRepository.findOne.mockResolvedValue({ id: 'user-2', organizationId: null, userType: 'BUYER', status: 'ACTIVE' });
    userRoleQueryBuilder.getMany.mockResolvedValue([]);
    const context = makeContext({ authorization: 'Bearer buyertoken' });

    const result = await guard.canActivate(context as never);

    expect(result).toBe(true);
    expect(organizationRepository.findOne).not.toHaveBeenCalled();
  });

  it('populates req.user with organizationId, userType, and role codes for a valid vendor token', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', publicId: 'pid', userType: 'VENDOR' });
    const context = makeContext({ authorization: 'Bearer validtoken' });

    const result = await guard.canActivate(context as never);

    expect(result).toBe(true);
    expect(context.request.user).toEqual({
      userId: 'user-1',
      organizationId: 'org-a',
      userType: 'VENDOR',
      roles: ['VENDOR_CHECKER'],
    });
  });

  it('populates req.user with a null organizationId and empty roles for a buyer with no role rows', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-2', publicId: 'pid', userType: 'BUYER' });
    userRepository.findOne.mockResolvedValue({ id: 'user-2', organizationId: null, userType: 'BUYER', status: 'ACTIVE' });
    userRoleQueryBuilder.getMany.mockResolvedValue([]);
    const context = makeContext({ authorization: 'Bearer buyertoken' });

    await guard.canActivate(context as never);

    expect(context.request.user).toEqual({
      userId: 'user-2',
      organizationId: null,
      userType: 'BUYER',
      roles: [],
    });
  });

  it('verifies the token against the same accessSecret AuthService signs with', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', publicId: 'pid', userType: 'VENDOR' });
    const context = makeContext({ authorization: 'Bearer sometoken' });

    await guard.canActivate(context as never);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('sometoken', { secret: 'test-secret' });
  });
});
