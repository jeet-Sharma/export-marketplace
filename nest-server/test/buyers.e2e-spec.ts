import { randomUUID } from 'crypto';
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

const PASSWORD = 'correct-horse-battery';

describe('BuyersController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailService)
      .useValue({ sendVerificationEmail: vi.fn().mockResolvedValue(undefined) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
  }, 15000);

  afterEach(async () => {
    await app.close();
  });

  /** Register a buyer, force it ACTIVE, log in, and return its email + access token. */
  async function activeBuyer(): Promise<{ email: string; accessToken: string }> {
    const email = `buyer-${randomUUID()}@example.com`;
    await request(app.getHttpServer()).post('/auth/register').send({ fullName: 'Profile Buyer', email, password: PASSWORD });
    await dataSource.query(`UPDATE users SET status = 'ACTIVE', email_verified = true WHERE email = $1`, [email]);
    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password: PASSWORD });
    return { email, accessToken: login.body.accessToken };
  }

  it('GET /buyers/me returns the authenticated buyer profile', async () => {
    const { email, accessToken } = await activeBuyer();

    const res = await request(app.getHttpServer()).get('/buyers/me').set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email,
      fullName: 'Profile Buyer',
      buyerType: 'INDIVIDUAL',
      isVerified: false,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.publicId).toBeDefined();
    // Nothing sensitive leaks.
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.taxIdEnc).toBeUndefined();
    expect(res.body.status).toBeUndefined();

    await cleanupUser(dataSource, email);
  });

  it('GET /buyers/me requires authentication', async () => {
    const res = await request(app.getHttpServer()).get('/buyers/me');
    expect(res.status).toBe(401);
  });

  it('PATCH /buyers/me updates editable fields and returns the merged profile', async () => {
    const { email, accessToken } = await activeBuyer();

    const res = await request(app.getHttpServer())
      .patch('/buyers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullName: 'Renamed Buyer', phone: '+1-555-0100', preferredLanguage: 'fr' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email,
      fullName: 'Renamed Buyer',
      phone: '+1-555-0100',
      preferredLanguage: 'fr',
    });

    // Persisted: a fresh GET reflects the change.
    const after = await request(app.getHttpServer()).get('/buyers/me').set('Authorization', `Bearer ${accessToken}`);
    expect(after.body.fullName).toBe('Renamed Buyer');
    expect(after.body.preferredLanguage).toBe('fr');

    await cleanupUser(dataSource, email);
  });

  it('PATCH /buyers/me switching to BUSINESS requires a company name', async () => {
    const { email, accessToken } = await activeBuyer();

    // BUSINESS without a company name → 400.
    const missing = await request(app.getHttpServer())
      .patch('/buyers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ buyerType: 'BUSINESS' });
    expect(missing.status).toBe(400);

    // BUSINESS with a company name → 200.
    const ok = await request(app.getHttpServer())
      .patch('/buyers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ buyerType: 'BUSINESS', companyName: 'Acme Imports LLC' });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ buyerType: 'BUSINESS', companyName: 'Acme Imports LLC' });

    await cleanupUser(dataSource, email);
  });

  it('PATCH /buyers/me rejects fields the buyer may not set', async () => {
    const { email, accessToken } = await activeBuyer();

    // email/isVerified aren't on the DTO; forbidNonWhitelisted → 400.
    const res = await request(app.getHttpServer())
      .patch('/buyers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isVerified: true, email: 'hijack@example.com' });
    expect(res.status).toBe(400);

    // Nothing changed.
    const after = await request(app.getHttpServer()).get('/buyers/me').set('Authorization', `Bearer ${accessToken}`);
    expect(after.body.email).toBe(email);
    expect(after.body.isVerified).toBe(false);

    await cleanupUser(dataSource, email);
  });

  it('PATCH /buyers/me rejects an unknown country code with a clean 400', async () => {
    const { email, accessToken } = await activeBuyer();

    // 'ZZ' passes the format regex but isn't a seeded reference country → FK
    // violation, surfaced as a clean 400.
    const res = await request(app.getHttpServer())
      .patch('/buyers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ country: 'ZZ' });
    expect(res.status).toBe(400);

    await cleanupUser(dataSource, email);
  });

  it('PATCH /buyers/me clearing companyName while BUSINESS is rejected', async () => {
    const { email, accessToken } = await activeBuyer();

    // Become a BUSINESS buyer with a company name.
    await request(app.getHttpServer())
      .patch('/buyers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ buyerType: 'BUSINESS', companyName: 'Acme Imports LLC' });

    // Now blanking the company name (staying BUSINESS) must fail against the
    // merged state, not just when buyerType is being changed.
    const res = await request(app.getHttpServer())
      .patch('/buyers/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ companyName: '   ' });
    expect(res.status).toBe(400);

    // Unchanged.
    const after = await request(app.getHttpServer()).get('/buyers/me').set('Authorization', `Bearer ${accessToken}`);
    expect(after.body.companyName).toBe('Acme Imports LLC');

    await cleanupUser(dataSource, email);
  });
});

async function cleanupUser(dataSource: DataSource, email: string): Promise<void> {
  await dataSource.query(`DELETE FROM auth_session WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM user_token WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM user_role WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM buyer_profile WHERE user_id = (SELECT id FROM users WHERE email = $1)`, [email]);
  await dataSource.query(`DELETE FROM users WHERE email = $1`, [email]);
}
