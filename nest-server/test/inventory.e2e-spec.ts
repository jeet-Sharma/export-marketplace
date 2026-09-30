import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import type { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';

process.env.AUTH_ACCESS_SECRET ??= `${randomUUID()}${randomUUID()}`;
process.env.AUTH_REFRESH_SECRET ??= `${randomUUID()}${randomUUID()}`;

/**
 * e2e coverage for the Inventory REST surface (Part 4), through real
 * HTTP, real JwtAuthGuard verification, and real Postgres. Complements
 * inventory.service.spec.ts (which mocks the repository/query-builder
 * layer) by exercising the actual atomic UPDATE statements and the
 * quantity_available >= 0 CHECK constraint against a real database.
 */
describe('Inventory (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let jwtService: JwtService;

  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
    jwtService = moduleFixture.get<JwtService>(JwtService);
  }, 20000);

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    for (const productId of createdProductIds.splice(0)) {
      await dataSource.query(`DELETE FROM stock_movement WHERE product_id = $1`, [productId]);
      await dataSource.query(`DELETE FROM stock_alert WHERE product_id = $1`, [productId]);
      await dataSource.query(`DELETE FROM inventory WHERE product_id = $1`, [productId]);
      await dataSource.query(`DELETE FROM product WHERE id = $1`, [productId]);
    }
    for (const userId of createdUserIds.splice(0)) {
      await dataSource.query(`DELETE FROM user_role WHERE user_id = $1`, [userId]);
      await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
    for (const orgId of createdOrgIds.splice(0)) {
      await dataSource.query(`DELETE FROM organization WHERE id = $1`, [orgId]);
    }
  });

  async function createOrganization(): Promise<string> {
    const rows = (await dataSource.query(
      `INSERT INTO organization (public_id, org_type, legal_name, display_name, email, status)
       VALUES ($1, 'VENDOR', $2, $2, $3, 'APPROVED')
       RETURNING id`,
      [randomUUID(), `E2E Inventory Vendor ${randomUUID()}`, `e2e-inv-${randomUUID()}@example.com`],
    )) as Array<{ id: string }>;
    createdOrgIds.push(rows[0].id);
    return rows[0].id;
  }

  async function createVendorUserWithToken(organizationId: string): Promise<{ token: string; userId: string }> {
    const email = `e2e-inv-${randomUUID()}@example.com`;
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, organization_id, full_name, email, auth_provider, status, email_verified)
       VALUES ($1, 'VENDOR', $2, 'E2E Inventory User', $3, 'LOCAL', 'ACTIVE', true)
       RETURNING id`,
      [randomUUID(), organizationId, email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;
    createdUserIds.push(userId);

    const token = await jwtService.signAsync(
      { sub: userId, publicId: randomUUID(), userType: 'VENDOR' },
      { secret: process.env.AUTH_ACCESS_SECRET },
    );
    return { token, userId };
  }

  /** Creates a product + its zero-quantity inventory row directly, bypassing the catalog API (inventory e2e doesn't need the approval workflow). */
  async function createProductWithInventory(
    organizationId: string,
    userId: string,
    quantityAvailable = '100',
  ): Promise<string> {
    const productRows = (await dataSource.query(
      `INSERT INTO product (public_id, organization_id, category_id, name, slug, base_price, base_currency, moq, unit, created_by)
       VALUES ($1, $2, 1, 'E2E Inventory Product', $3, 10, 'USD', 1, 'KG', $4)
       RETURNING id`,
      [randomUUID(), organizationId, `e2e-inv-product-${randomUUID()}`, userId],
    )) as Array<{ id: string }>;
    const productId = productRows[0].id;
    createdProductIds.push(productId);

    await dataSource.query(
      `INSERT INTO inventory (product_id, organization_id, quantity_available, quantity_reserved, low_stock_threshold, unit)
       VALUES ($1, $2, $3, 0, 10, 'KG')`,
      [productId, organizationId, quantityAvailable],
    );

    return productId;
  }

  function authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  describe('authentication and organization isolation', () => {
    it('GET /inventory/:productId returns 401 without a token', async () => {
      const response = await request(app.getHttpServer()).get('/inventory/1');
      expect(response.status).toBe(401);
    });

    it('a vendor cannot read inventory belonging to a different organization', async () => {
      const orgA = await createOrganization();
      const orgB = await createOrganization();
      const { token: tokenA, userId: userA } = await createVendorUserWithToken(orgA);
      const { token: tokenB } = await createVendorUserWithToken(orgB);
      const productId = await createProductWithInventory(orgA, userA);

      const crossOrgRead = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .set(authHeader(tokenB));
      expect(crossOrgRead.status).toBe(404);

      const sameOrgRead = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .set(authHeader(tokenA));
      expect(sameOrgRead.status).toBe(200);
      expect(sameOrgRead.body.quantityAvailable).toBe('100.000');
    });
  });

  describe('POST /inventory/:productId/adjust — manual adjustment (Part 4.3)', () => {
    it('applies a positive ADJUSTMENT and returns the resulting movement row', async () => {
      const org = await createOrganization();
      const { token, userId } = await createVendorUserWithToken(org);
      const productId = await createProductWithInventory(org, userId, '100');

      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(token))
        .send({ movementType: 'ADJUSTMENT', quantityChange: 15, notes: 'physical recount found extra stock' });

      expect(response.status).toBe(201);
      expect(response.body.movementType).toBe('ADJUSTMENT');
      expect(response.body.availableAfter).toBe('115.000');

      const inventoryCheck = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .set(authHeader(token));
      expect(inventoryCheck.body.quantityAvailable).toBe('115.000');
    });

    it('rejects an empty notes field with 400', async () => {
      const org = await createOrganization();
      const { token, userId } = await createVendorUserWithToken(org);
      const productId = await createProductWithInventory(org, userId, '100');

      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(token))
        .send({ movementType: 'ADJUSTMENT', quantityChange: 5, notes: '' });

      expect(response.status).toBe(400);
    });

    it('rejects a DAMAGE entry with a positive quantityChange with 400', async () => {
      const org = await createOrganization();
      const { token, userId } = await createVendorUserWithToken(org);
      const productId = await createProductWithInventory(org, userId, '100');

      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(token))
        .send({ movementType: 'DAMAGE', quantityChange: 5, notes: 'should not increase stock' });

      expect(response.status).toBe(400);
    });

    it('rejects an adjustment that would drive quantity_available negative with a clean 409, not a raw DB error', async () => {
      const org = await createOrganization();
      const { token, userId } = await createVendorUserWithToken(org);
      const productId = await createProductWithInventory(org, userId, '10');

      const response = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(token))
        .send({ movementType: 'DAMAGE', quantityChange: -50, notes: 'warehouse flood destroyed stock' });

      // Previously this fell through to the DB's own
      // CHECK(quantity_available >= 0) and surfaced as an unhandled 500.
      expect(response.status).toBe(409);

      // Confirm the balance was NOT changed by the rejected adjustment.
      const inventoryCheck = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .set(authHeader(token));
      expect(inventoryCheck.body.quantityAvailable).toBe('10.000');
    });

    it('returns 404 for a product with no inventory row in the caller organization', async () => {
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org);

      const response = await request(app.getHttpServer())
        .post('/inventory/999999999/adjust')
        .set(authHeader(token))
        .send({ movementType: 'ADJUSTMENT', quantityChange: 5, notes: 'recount' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /inventory/:productId/movements — audit trail', () => {
    it('reflects a manual adjustment in the movement history, newest first', async () => {
      const org = await createOrganization();
      const { token, userId } = await createVendorUserWithToken(org);
      const productId = await createProductWithInventory(org, userId, '50');

      await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(token))
        .send({ movementType: 'ADJUSTMENT', quantityChange: 10, notes: 'first adjustment' });
      await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(token))
        .send({ movementType: 'ADJUSTMENT', quantityChange: -5, notes: 'second adjustment' });

      const response = await request(app.getHttpServer())
        .get(`/inventory/${productId}/movements`)
        .set(authHeader(token));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].notes).toBe('second adjustment');
      expect(response.body[1].notes).toBe('first adjustment');
    });
  });
});
