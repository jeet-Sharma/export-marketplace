import { createHash, randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import request from 'supertest';
import { App } from 'supertest/types.js';
import type { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { EmailService } from '../src/modules/email/email.service.js';

process.env.AUTH_ACCESS_SECRET ??= `${randomUUID()}${randomUUID()}`;
process.env.AUTH_REFRESH_SECRET ??= `${randomUUID()}${randomUUID()}`;

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let sendVerificationEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sendVerificationEmail = vi.fn().mockResolvedValue(undefined);
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailService)
      .useValue({ sendVerificationEmail })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
  }, 15000);

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/register creates a PENDING buyer and sends verification email', async () => {
    const email = `e2e-${randomUUID()}@example.com`;
    const first = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'E2E Test Buyer',
      email,
      password: 'correct-horse-battery',
    });

    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ fullName: 'E2E Test Buyer', email, status: 'PENDING' });
    expect(first.body.id).toBeDefined();
    expect(first.body.passwordHash).toBeUndefined();
    expect(sendVerificationEmail).toHaveBeenCalledOnce();
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email, fullName: 'E2E Test Buyer', token: expect.any(String) }),
    );

    const duplicate = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Someone Else',
      email,
      password: 'another-long-password',
    });
    expect(duplicate.status).toBe(409);

    await cleanupUser(dataSource, email);
  });

  it('POST /auth/register still succeeds (201) when the verification email fails to send', async () => {
    // A mail outage must not strand the buyer: the account is committed, so
    // registration returns 201 and the buyer can recover via
    // /auth/resend-verification. See auth.service.ts registerBuyer().
    sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));
    const email = `mailfail-${randomUUID()}@example.com`;

    const response = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Mail Outage Buyer',
      email,
      password: 'correct-horse-battery',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ email, status: 'PENDING' });

    const [user] = (await dataSource.query(`SELECT status FROM users WHERE email = $1`, [email])) as Array<{
      status: string;
    }>;
    expect(user.status).toBe('PENDING');

    await cleanupUser(dataSource, email);
  });

  it('POST /auth/resend-verification issues a new token and keeps the prior one valid', async () => {
    const email = `resend-${randomUUID()}@example.com`;
    const oldTokenHash = createHash('sha256').update('old-token').digest('hex');
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, full_name, email, password_hash, auth_provider, status)
       VALUES ($1, 'BUYER', 'Resend Buyer', $2, 'test-hash', 'LOCAL', 'PENDING')
       RETURNING id`,
      [randomUUID(), email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;

    // Backdate the existing token past the resend cooldown so this happy-path
    // resend is not throttled (see the cooldown test below).
    await dataSource.query(
      `INSERT INTO user_token (user_id, token_type, token_hash, expires_at, created_at)
       VALUES ($1, 'EMAIL_VERIFY', $2, now() + interval '1 hour', now() - interval '10 minutes')`,
      [userId, oldTokenHash],
    );

    const response = await request(app.getHttpServer()).post('/auth/resend-verification').send({ email });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'If an eligible account exists, a verification email has been sent.' });
    expect(sendVerificationEmail).toHaveBeenCalledOnce();
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email, fullName: 'Resend Buyer', token: expect.any(String) }),
    );

    // A new token is added; the prior token is intentionally left valid
    // (unused) so a later mail failure can never strand the buyer with a
    // dead link. Both are unused single-use tokens.
    const tokens = (await dataSource.query(
      `SELECT token_hash, used_at FROM user_token WHERE user_id = $1 AND token_type = 'EMAIL_VERIFY' ORDER BY id`,
      [userId],
    )) as Array<{ token_hash: string; used_at: Date | null }>;
    expect(tokens).toHaveLength(2);
    expect(tokens[0].token_hash).toBe(oldTokenHash);
    expect(tokens.every((t) => t.used_at === null)).toBe(true);

    await dataSource.query(`DELETE FROM user_token WHERE user_id = $1`, [userId]);
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('POST /auth/resend-verification keeps all tokens valid when the email fails to send', async () => {
    // If delivery fails, no link is destroyed: the prior token stays valid
    // AND the newly persisted token stays valid. The buyer is never stranded.
    // See auth.service.ts resendVerification() (lock-first, additive token,
    // send-after-commit).
    sendVerificationEmail.mockRejectedValueOnce(new Error('SMTP unavailable'));
    const email = `resend-fail-${randomUUID()}@example.com`;
    const oldTokenHash = createHash('sha256').update(`old-${randomUUID()}`).digest('hex');
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, full_name, email, password_hash, auth_provider, status)
       VALUES ($1, 'BUYER', 'Resend Fail Buyer', $2, 'test-hash', 'LOCAL', 'PENDING')
       RETURNING id`,
      [randomUUID(), email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;

    // Backdate past the cooldown so the email send is actually attempted.
    await dataSource.query(
      `INSERT INTO user_token (user_id, token_type, token_hash, expires_at, created_at)
       VALUES ($1, 'EMAIL_VERIFY', $2, now() + interval '1 hour', now() - interval '10 minutes')`,
      [userId, oldTokenHash],
    );

    const response = await request(app.getHttpServer()).post('/auth/resend-verification').send({ email });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'If an eligible account exists, a verification email has been sent.' });

    // Both the old and the newly persisted token remain valid (unused).
    const tokens = (await dataSource.query(
      `SELECT token_hash, used_at FROM user_token WHERE user_id = $1 AND token_type = 'EMAIL_VERIFY' ORDER BY id`,
      [userId],
    )) as Array<{ token_hash: string; used_at: Date | null }>;
    expect(tokens).toHaveLength(2);
    expect(tokens[0].token_hash).toBe(oldTokenHash);
    expect(tokens.every((t) => t.used_at === null)).toBe(true);

    await dataSource.query(`DELETE FROM user_token WHERE user_id = $1`, [userId]);
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('POST /auth/resend-verification is a no-op once the account is already active', async () => {
    // Models the race where verifyEmail activates the buyer between resend's
    // unlocked eligibility read and its locked re-check: an ACTIVE/verified
    // account must not get a new token or email, since verification would
    // reject any link issued for it. See the locked re-check in
    // auth.service.ts resendVerification().
    const email = `active-${randomUUID()}@example.com`;
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, full_name, email, password_hash, auth_provider, status, email_verified)
       VALUES ($1, 'BUYER', 'Already Active Buyer', $2, 'test-hash', 'LOCAL', 'ACTIVE', true)
       RETURNING id`,
      [randomUUID(), email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;

    const response = await request(app.getHttpServer()).post('/auth/resend-verification').send({ email });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'If an eligible account exists, a verification email has been sent.' });
    expect(sendVerificationEmail).not.toHaveBeenCalled();

    const tokens = (await dataSource.query(
      `SELECT id FROM user_token WHERE user_id = $1 AND token_type = 'EMAIL_VERIFY'`,
      [userId],
    )) as Array<{ id: string }>;
    expect(tokens).toHaveLength(0);

    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('POST /auth/resend-verification is throttled by the per-account cooldown', async () => {
    // A token issued just now (within the cooldown window) must cause the
    // next resend to be a no-op: no email sent, no new token, existing token
    // untouched — this is the anti-abuse throttle on an unauthenticated
    // endpoint. See auth.service.ts RESEND_COOLDOWN_SECONDS.
    const email = `cooldown-${randomUUID()}@example.com`;
    const recentTokenHash = createHash('sha256').update(`recent-${randomUUID()}`).digest('hex');
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, full_name, email, password_hash, auth_provider, status)
       VALUES ($1, 'BUYER', 'Cooldown Buyer', $2, 'test-hash', 'LOCAL', 'PENDING')
       RETURNING id`,
      [randomUUID(), email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;

    // Issued "now" — inside the cooldown window.
    await dataSource.query(
      `INSERT INTO user_token (user_id, token_type, token_hash, expires_at, created_at)
       VALUES ($1, 'EMAIL_VERIFY', $2, now() + interval '1 hour', now())`,
      [userId, recentTokenHash],
    );

    const response = await request(app.getHttpServer()).post('/auth/resend-verification').send({ email });

    // Same generic response, but no side effects occurred.
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'If an eligible account exists, a verification email has been sent.' });
    expect(sendVerificationEmail).not.toHaveBeenCalled();

    const tokens = (await dataSource.query(
      `SELECT token_hash, used_at FROM user_token WHERE user_id = $1 AND token_type = 'EMAIL_VERIFY' ORDER BY id`,
      [userId],
    )) as Array<{ token_hash: string; used_at: Date | null }>;
    expect(tokens).toHaveLength(1);
    expect(tokens[0].token_hash).toBe(recentTokenHash);
    expect(tokens[0].used_at).toBeNull();

    await dataSource.query(`DELETE FROM user_token WHERE user_id = $1`, [userId]);
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('POST /auth/resend-verification uses the same response for an unknown email', async () => {
    const response = await request(app.getHttpServer()).post('/auth/resend-verification').send({
      email: `unknown-${randomUUID()}@example.com`,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'If an eligible account exists, a verification email has been sent.' });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('POST /auth/verify-email activates a pending buyer and consumes the token', async () => {
    const email = `verify-${randomUUID()}@example.com`;
    const rawToken = randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, full_name, email, password_hash, auth_provider, status)
       VALUES ($1, 'BUYER', 'Verification Buyer', $2, 'test-hash', 'LOCAL', 'PENDING')
       RETURNING id`,
      [randomUUID(), email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;

    await dataSource.query(
      `INSERT INTO user_token (user_id, token_type, token_hash, expires_at)
       VALUES ($1, 'EMAIL_VERIFY', $2, now() + interval '1 hour')`,
      [userId, tokenHash],
    );

    const response = await request(app.getHttpServer()).post('/auth/verify-email').send({ token: rawToken });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Email verified successfully.' });

    const [user] = (await dataSource.query(`SELECT email_verified, status FROM users WHERE id = $1`, [userId])) as Array<{
      email_verified: boolean;
      status: string;
    }>;
    const [token] = (await dataSource.query(
      `SELECT used_at FROM user_token WHERE user_id = $1 AND token_type = 'EMAIL_VERIFY'`,
      [userId],
    )) as Array<{ used_at: Date | null }>;

    expect(user).toEqual({ email_verified: true, status: 'ACTIVE' });
    expect(token.used_at).not.toBeNull();

    const replay = await request(app.getHttpServer()).post('/auth/verify-email').send({ token: rawToken });
    expect(replay.status).toBe(400);

    await dataSource.query(`DELETE FROM user_token WHERE user_id = $1`, [userId]);
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('POST /auth/verify-email rejects malformed and unknown tokens', async () => {
    const malformed = await request(app.getHttpServer()).post('/auth/verify-email').send({ token: 'short' });
    expect(malformed.status).toBe(400);

    const unknown = await request(app.getHttpServer()).post('/auth/verify-email').send({ token: 'a'.repeat(64) });
    expect(unknown.status).toBe(400);
  });

  it('POST /auth/login returns access and refresh tokens for a verified buyer', async () => {
    const email = `login-${randomUUID()}@example.com`;
    const registration = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Login Buyer',
      email,
      password: 'correct-horse-battery',
    });
    expect(registration.status).toBe(201);

    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);

    const response = await request(app.getHttpServer()).post('/auth/login').send({
      email,
      password: 'correct-horse-battery',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ tokenType: 'Bearer', expiresIn: expect.any(Number) });
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));

    const [session] = (await dataSource.query(
      `SELECT user_id, revoked_at, expires_at FROM auth_session WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email],
    )) as Array<{ user_id: string; revoked_at: Date | null; expires_at: Date }>;
    expect(session.revoked_at).toBeNull();
    expect(new Date(session.expires_at).getTime()).toBeGreaterThan(Date.now());

    await dataSource.query(`DELETE FROM auth_session WHERE user_id = $1`, [session.user_id]);
    await cleanupUser(dataSource, email);
  });

  it('POST /auth/refresh rotates tokens and rejects reuse of the old refresh token', async () => {
    const email = `refresh-${randomUUID()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Refresh Buyer',
      email,
      password: 'correct-horse-battery',
    });
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });
    const firstRefresh: string = login.body.refreshToken;

    // Exchange the refresh token for a new pair.
    const refreshed = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: firstRefresh });
    expect(refreshed.status).toBe(201);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).toEqual(expect.any(String));
    expect(refreshed.body.refreshToken).not.toBe(firstRefresh);

    // The new access token works against a guarded route.
    const me = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${refreshed.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email, userType: 'BUYER' });

    // Rotation: replaying the FIRST refresh token is now rejected (its
    // session was revoked when it was rotated).
    const replay = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: firstRefresh });
    expect(replay.status).toBe(401);

    // The newly issued refresh token still works.
    const secondRefresh = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: refreshed.body.refreshToken });
    expect(secondRefresh.status).toBe(201);

    await cleanupUser(dataSource, email);
  });

  it('POST /auth/logout revokes the session so its refresh token can no longer be used', async () => {
    const email = `logout-${randomUUID()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Logout Buyer',
      email,
      password: 'correct-horse-battery',
    });
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });
    const refreshToken: string = login.body.refreshToken;

    const logout = await request(app.getHttpServer()).post('/auth/logout').send({ refreshToken });
    expect(logout.status).toBe(201);
    expect(logout.body).toEqual({ message: 'Logged out.' });

    // The session is revoked; refreshing with that token now fails.
    const afterLogout = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken });
    expect(afterLogout.status).toBe(401);

    await cleanupUser(dataSource, email);
  });

  it('POST /auth/logout is idempotent and succeeds even for an invalid token', async () => {
    const fakeJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwic2Vzc2lvbklkIjoiMSIsImp0aSI6IngiLCJ0eXBlIjoicmVmcmVzaCJ9.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const response = await request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: fakeJwt });
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Logged out.' });
  });

  it('POST /auth/logout-all revokes every session for the buyer', async () => {
    const email = `logoutall-${randomUUID()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Logout All Buyer',
      email,
      password: 'correct-horse-battery',
    });
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);

    // Two separate logins → two live sessions.
    const login1 = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });
    const login2 = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });

    const logoutAll = await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${login1.body.accessToken}`);
    expect(logoutAll.status).toBe(201);
    expect(logoutAll.body).toEqual({ message: 'Logged out of all devices.' });

    // Both sessions' refresh tokens are now dead.
    const refresh1 = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: login1.body.refreshToken });
    const refresh2 = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: login2.body.refreshToken });
    expect(refresh1.status).toBe(401);
    expect(refresh2.status).toBe(401);

    // No live sessions remain.
    const [live] = (await dataSource.query(
      `SELECT count(*)::int AS n FROM auth_session WHERE user_id = (SELECT id FROM users WHERE email = $1) AND revoked_at IS NULL`,
      [email],
    )) as Array<{ n: number }>;
    expect(live.n).toBe(0);

    await cleanupUser(dataSource, email);
  });

  it('POST /auth/logout-all revokes a rotated session too, leaving nothing live', async () => {
    // Guards the invariant that logout-all and refresh rotation serialize on
    // the user row: after rotating a token, logout-all must kill the freshly
    // minted session as well, not just the original.
    const email = `logoutall-rotate-${randomUUID()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Logout All Rotate Buyer',
      email,
      password: 'correct-horse-battery',
    });
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);

    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });

    // Rotate: the original session is revoked, a new one is minted.
    const refreshed = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: login.body.refreshToken });
    expect(refreshed.status).toBe(201);

    // Log out everywhere using the rotated access token.
    const logoutAll = await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${refreshed.body.accessToken}`);
    expect(logoutAll.status).toBe(201);

    // The rotated (newest) refresh token is now dead too.
    const afterLogoutAll = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken });
    expect(afterLogoutAll.status).toBe(401);

    const [live] = (await dataSource.query(
      `SELECT count(*)::int AS n FROM auth_session WHERE user_id = (SELECT id FROM users WHERE email = $1) AND revoked_at IS NULL`,
      [email],
    )) as Array<{ n: number }>;
    expect(live.n).toBe(0);

    await cleanupUser(dataSource, email);
  });

  it('POST /auth/logout-all requires authentication', async () => {
    const response = await request(app.getHttpServer()).post('/auth/logout-all');
    expect(response.status).toBe(401);
  });

  it('POST /auth/refresh rejects a malformed refresh token', async () => {
    // A non-JWT string fails DTO validation (@IsJWT) → 400.
    const garbage = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: 'not-a-jwt' });
    expect(garbage.status).toBe(400);

    // A syntactically valid but unrecognised JWT is rejected by the service
    // (wrong signature) → 401.
    const fakeJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwic2Vzc2lvbklkIjoiMSIsImp0aSI6IngiLCJ0eXBlIjoicmVmcmVzaCJ9.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const forged = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: fakeJwt });
    expect(forged.status).toBe(401);
  });

  it('GET /auth/me returns the authenticated buyer for a valid access token', async () => {
    const email = `me-${randomUUID()}@example.com`;
    const registration = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Me Buyer',
      email,
      password: 'correct-horse-battery',
    });
    expect(registration.status).toBe(201);
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);

    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });
    expect(login.status).toBe(201);
    const accessToken: string = login.body.accessToken;

    const me = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ email, userType: 'BUYER' });
    expect(me.body.id).toBeDefined();
    expect(me.body.publicId).toBeDefined();
    // Buyers have no organization, hold the BUYER role, and (until the BUYER
    // role's permissions are seeded) no resolved permissions.
    expect(me.body.organizationId).toBeNull();
    expect(me.body.roles).toEqual(['BUYER']);
    expect(me.body.permissions).toEqual([]);

    await cleanupUser(dataSource, email);
  });

  it('GET /auth/me rejects a refresh token presented as a bearer access token', async () => {
    // A refresh token carries `sub` too; without the access-token `type`
    // check it could pass the guard (especially if both secrets matched) and
    // reach guarded routes for its much longer lifetime.
    const email = `refresh-as-access-${randomUUID()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Refresh As Access Buyer',
      email,
      password: 'correct-horse-battery',
    });
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.refreshToken}`);
    expect(me.status).toBe(401);

    await cleanupUser(dataSource, email);
  });

  it('GET /auth/me rejects a missing or malformed token', async () => {
    const noToken = await request(app.getHttpServer()).get('/auth/me');
    expect(noToken.status).toBe(401);

    const garbage = await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Bearer not-a-real-jwt');
    expect(garbage.status).toBe(401);

    const wrongScheme = await request(app.getHttpServer()).get('/auth/me').set('Authorization', 'Basic abc123');
    expect(wrongScheme.status).toBe(401);
  });

  it('GET /auth/me rejects a valid token whose account is no longer ACTIVE', async () => {
    // A cryptographically valid token must stop working the moment the
    // account is blocked — the guard re-checks status against the DB.
    const email = `blocked-${randomUUID()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Blocked Buyer',
      email,
      password: 'correct-horse-battery',
    });
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'correct-horse-battery' });
    const accessToken: string = login.body.accessToken;

    // Block the account after the token was issued.
    await dataSource.query(`UPDATE users SET status = 'BLOCKED' WHERE email = $1`, [email]);

    const me = await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(401);

    await cleanupUser(dataSource, email);
  });

  it('POST /auth/login rejects invalid credentials and records a failed attempt', async () => {
    const email = `failed-login-${randomUUID()}@example.com`;
    const registration = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Failed Login Buyer',
      email,
      password: 'correct-horse-battery',
    });
    expect(registration.status).toBe(201);
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);

    const response = await request(app.getHttpServer()).post('/auth/login').send({
      email,
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    const [user] = (await dataSource.query(`SELECT failed_login_count FROM users WHERE email = $1`, [email])) as Array<{
      failed_login_count: number;
    }>;
    expect(user.failed_login_count).toBe(1);
    await cleanupUser(dataSource, email);
  });


  it('POST /auth/register returns 400 for an unsupported country code', async () => {
    // "ZZ" passes the DTO format check but has no row in the (unseeded)
    // country reference table, so the FK violation must surface as a clean
    // 400, not a raw 500.
    const response = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'FK Violation Buyer',
      email: `fk-${randomUUID()}@example.com`,
      password: 'correct-horse-battery',
      country: 'ZZ',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('The provided country or currency code is not supported.');
  });

  it('POST /auth/register rejects an invalid payload', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'X',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
  });

  it('POST /auth/register rejects client-supplied fields not on the DTO', async () => {
    const response = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Should Not Register',
      email: `e2e-${randomUUID()}@example.com`,
      password: 'correct-horse-battery',
      organizationId: 999,
    });

    expect(response.status).toBe(400);
  });
});

async function cleanupUser(dataSource: DataSource, email: string): Promise<void> {
  await dataSource.query(`DELETE FROM auth_session WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM user_token WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM user_role WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM buyer_profile WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM users WHERE email = $1`, [email]);
}
