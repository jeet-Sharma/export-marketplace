import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import type { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

// Requires a reachable Postgres with migrations applied — see
// app.e2e-spec.ts's header comment for why (AuthModule needs a real
// DataSource; there is no mock for it here).
describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
  }, 15000);

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/register creates a PENDING buyer and rejects a duplicate email', async () => {
    const email = `e2e-${randomUUID()}@example.com`;

    const first = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'E2E Test Buyer',
      email,
      password: 'correct-horse-battery',
    });

    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ fullName: 'E2E Test Buyer', email, status: 'PENDING' });
    expect(first.body.id).toBeDefined();
    // Never echoed back — see RegisterBuyerResponseDto.
    expect(first.body.passwordHash).toBeUndefined();

    const duplicate = await request(app.getHttpServer()).post('/auth/register').send({
      fullName: 'Someone Else',
      email,
      password: 'another-long-password',
    });
    expect(duplicate.status).toBe(409);

    // Clean up: this test writes real rows via the real DataSource, so it
    // must remove them itself rather than leaving fixture data behind.
    await dataSource.query(
      `DELETE FROM user_token WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email],
    );
    await dataSource.query(
      `DELETE FROM user_role WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email],
    );
    await dataSource.query(
      `DELETE FROM buyer_profile WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
      [email],
    );
    await dataSource.query(`DELETE FROM users WHERE email = $1`, [email]);
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
