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

  it('POST /auth/resend-verification replaces an active token for a pending buyer', async () => {
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
    // replacement is not throttled (see the cooldown test below).
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

    const tokens = (await dataSource.query(
      `SELECT token_hash, used_at FROM user_token WHERE user_id = $1 AND token_type = 'EMAIL_VERIFY' ORDER BY id`,
      [userId],
    )) as Array<{ token_hash: string; used_at: Date | null }>;
    expect(tokens).toHaveLength(2);
    expect(tokens[0].token_hash).toBe(oldTokenHash);
    expect(tokens[0].used_at).not.toBeNull();
    expect(tokens[1].used_at).toBeNull();

    await dataSource.query(`DELETE FROM user_token WHERE user_id = $1`, [userId]);
    await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  it('POST /auth/resend-verification leaves the existing token valid when the email fails to send', async () => {
    // If delivery fails, the buyer's previously delivered link must remain
    // usable — the old token must NOT be invalidated, and no new token is
    // persisted. See auth.service.ts resendVerification() (send-before-write).
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

    // The old token is still the only token and is still unused/valid.
    const tokens = (await dataSource.query(
      `SELECT token_hash, used_at FROM user_token WHERE user_id = $1 AND token_type = 'EMAIL_VERIFY' ORDER BY id`,
      [userId],
    )) as Array<{ token_hash: string; used_at: Date | null }>;
    expect(tokens).toHaveLength(1);
    expect(tokens[0].token_hash).toBe(oldTokenHash);
    expect(tokens[0].used_at).toBeNull();

    await dataSource.query(`DELETE FROM user_token WHERE user_id = $1`, [userId]);
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
  await dataSource.query(`DELETE FROM user_token WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM user_role WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM buyer_profile WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM users WHERE email = $1`, [email]);
}
