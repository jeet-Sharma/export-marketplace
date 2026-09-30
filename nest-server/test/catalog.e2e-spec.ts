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
 * e2e coverage for the Catalog REST surface (Part 3), through real HTTP,
 * real JwtAuthGuard verification, and real Postgres — the three layers
 * unit tests (products.service.spec.ts, jwt-auth.guard.spec.ts) each
 * exercise in isolation. Confirms the whole stack actually works
 * together: a bearer token issued the same way AuthService issues one,
 * verified by JwtAuthGuard, populating req.user, read by ProductsService,
 * enforced against real role_permission/organization rows, applied to a
 * real product row with real DB constraints.
 */
describe('Catalog (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let jwtService: JwtService;

  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];

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
    // Cleanup runs after every test rather than relying on a shared fixture
    // teardown, since several tests create their own org/user rows. Strict
    // FK-safe order: every catalog child table FKs to
    // product(id, organization_id), so those clear first; product/
    // inventory reference organization, so they clear next; users
    // reference organization too, so they clear before organization
    // itself, which is deleted last of all.
    const orgIds = createdOrgIds.splice(0);
    for (const orgId of orgIds) {
      await dataSource.query(`DELETE FROM product_approval_log WHERE organization_id = $1`, [orgId]);
      await dataSource.query(`DELETE FROM product_price_tier WHERE organization_id = $1`, [orgId]);
      await dataSource.query(`DELETE FROM product_target_country WHERE organization_id = $1`, [orgId]);
      await dataSource.query(`DELETE FROM product_media WHERE organization_id = $1`, [orgId]);
      // stock_movement and stock_alert also FK to product(id, organization_id)
      // — the /inventory/:productId/adjust calls used by unit-change-safety
      // tests create these rows, so they must clear before product does.
      await dataSource.query(`DELETE FROM stock_movement WHERE organization_id = $1`, [orgId]);
      await dataSource.query(`DELETE FROM stock_alert WHERE organization_id = $1`, [orgId]);
      await dataSource.query(`DELETE FROM inventory WHERE organization_id = $1`, [orgId]);
      await dataSource.query(`DELETE FROM product WHERE organization_id = $1`, [orgId]);
      await dataSource.query(`DELETE FROM vendor_target_country WHERE organization_id = $1`, [orgId]);
    }
    for (const userId of createdUserIds.splice(0)) {
      await dataSource.query(`DELETE FROM user_role WHERE user_id = $1`, [userId]);
      await dataSource.query(`DELETE FROM users WHERE id = $1`, [userId]);
    }
    for (const orgId of orgIds) {
      await dataSource.query(`DELETE FROM organization WHERE id = $1`, [orgId]);
    }
  });

  /** Creates a VENDOR organization row and returns its id. */
  async function createOrganization(overrides: { requiresSecondApprover?: boolean } = {}): Promise<string> {
    const rows = (await dataSource.query(
      `INSERT INTO organization (public_id, org_type, legal_name, display_name, email, requires_second_approver, status)
       VALUES ($1, 'VENDOR', $2, $2, $3, $4, 'APPROVED')
       RETURNING id`,
      [
        randomUUID(),
        `E2E Vendor ${randomUUID()}`,
        `e2e-org-${randomUUID()}@example.com`,
        overrides.requiresSecondApprover ?? true,
      ],
    )) as Array<{ id: string }>;
    const orgId = rows[0].id;
    createdOrgIds.push(orgId);
    return orgId;
  }

  /**
   * Creates a VENDOR user in the given org, assigns roleCodes, and returns
   * a signed access token + userId. ADMIN is a PLATFORM-scope role
   * (Part 2.11) — the DB's check_user_role_scope_match trigger refuses to
   * assign it to a VENDOR-org user, so callers needing an ADMIN reviewer
   * use createPlatformAdminWithToken() instead.
   */
  async function createVendorUserWithToken(
    organizationId: string,
    roleCodes: string[],
  ): Promise<{ token: string; userId: string }> {
    const email = `e2e-${randomUUID()}@example.com`;
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, organization_id, full_name, email, auth_provider, status, email_verified)
       VALUES ($1, 'VENDOR', $2, 'E2E Vendor User', $3, 'LOCAL', 'ACTIVE', true)
       RETURNING id`,
      [randomUUID(), organizationId, email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;
    createdUserIds.push(userId);

    await assignRoles(userId, roleCodes);

    const token = await jwtService.signAsync(
      { sub: userId, publicId: randomUUID(), userType: 'VENDOR' },
      { secret: process.env.AUTH_ACCESS_SECRET },
    );
    return { token, userId };
  }

  /**
   * Creates (or reuses) the single PLATFORM organization row and a
   * PLATFORM-type user in it holding the ADMIN role — the only way the DB
   * trigger allows an ADMIN role assignment (Part 2.11's scope match:
   * PLATFORM-scope roles require a PLATFORM-org user). organization has a
   * partial unique index allowing exactly one PLATFORM row, so this reuses
   * whichever one already exists rather than trying to create a second.
   */
  async function createPlatformAdminWithToken(): Promise<{ token: string; userId: string }> {
    let platformOrgRows = (await dataSource.query(
      `SELECT id FROM organization WHERE org_type = 'PLATFORM' LIMIT 1`,
    )) as Array<{ id: string }>;
    let platformOrgId: string;
    if (platformOrgRows.length === 0) {
      const inserted = (await dataSource.query(
        `INSERT INTO organization (public_id, org_type, legal_name, display_name, email, status)
         VALUES ($1, 'PLATFORM', 'E2E Platform', 'E2E Platform', $2, 'APPROVED')
         RETURNING id`,
        [randomUUID(), `e2e-platform-${randomUUID()}@example.com`],
      )) as Array<{ id: string }>;
      platformOrgId = inserted[0].id;
      createdOrgIds.push(platformOrgId);
    } else {
      platformOrgId = platformOrgRows[0].id;
      // Not tracked in createdOrgIds — this row pre-existed and is shared
      // across tests/other suites, so it is never deleted by this spec's
      // own cleanup.
    }

    const email = `e2e-admin-${randomUUID()}@example.com`;
    const userRows = (await dataSource.query(
      `INSERT INTO users (public_id, user_type, organization_id, full_name, email, auth_provider, status, email_verified)
       VALUES ($1, 'PLATFORM', $2, 'E2E Platform Admin', $3, 'LOCAL', 'ACTIVE', true)
       RETURNING id`,
      [randomUUID(), platformOrgId, email],
    )) as Array<{ id: string }>;
    const userId = userRows[0].id;
    createdUserIds.push(userId);

    await assignRoles(userId, ['ADMIN']);

    const token = await jwtService.signAsync(
      { sub: userId, publicId: randomUUID(), userType: 'PLATFORM' },
      { secret: process.env.AUTH_ACCESS_SECRET },
    );
    return { token, userId };
  }

  async function assignRoles(userId: string, roleCodes: string[]): Promise<void> {
    for (const code of roleCodes) {
      const roleRows = (await dataSource.query(`SELECT id FROM role WHERE code = $1`, [code])) as Array<{
        id: string;
      }>;
      if (roleRows.length === 0) {
        throw new Error(`Role ${code} is not seeded — did SeedApprovalRoles1732800000007 run?`);
      }
      await dataSource.query(`INSERT INTO user_role (user_id, role_id) VALUES ($1, $2)`, [userId, roleRows[0].id]);
    }
  }

  function authHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  function baseProductPayload(overrides: Record<string, unknown> = {}) {
    return {
      categoryId: 1,
      name: 'E2E Turmeric',
      slug: `e2e-turmeric-${randomUUID()}`,
      basePrice: 10,
      baseCurrency: 'USD',
      moq: 100,
      unit: 'KG',
      ...overrides,
    };
  }

  describe('authentication', () => {
    it('GET /catalog/products returns 401 without a bearer token', async () => {
      const response = await request(app.getHttpServer()).get('/catalog/products');
      expect(response.status).toBe(401);
    });

    it('GET /catalog/products returns 401 with a malformed token', async () => {
      const response = await request(app.getHttpServer())
        .get('/catalog/products')
        .set('Authorization', 'Bearer not-a-real-token');
      expect(response.status).toBe(401);
    });

    it('POST /catalog/products returns 403 for a BUYER token (no organizationId)', async () => {
      const email = `e2e-buyer-${randomUUID()}@example.com`;
      const buyerRows = (await dataSource.query(
        `INSERT INTO users (public_id, user_type, full_name, email, auth_provider, status, email_verified)
         VALUES ($1, 'BUYER', 'E2E Buyer', $2, 'LOCAL', 'ACTIVE', true)
         RETURNING id`,
        [randomUUID(), email],
      )) as Array<{ id: string }>;
      const buyerId = buyerRows[0].id;
      createdUserIds.push(buyerId);

      const token = await jwtService.signAsync(
        { sub: buyerId, publicId: randomUUID(), userType: 'BUYER' },
        { secret: process.env.AUTH_ACCESS_SECRET },
      );

      const response = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload());

      expect(response.status).toBe(403);
    });
  });

  describe('organization isolation', () => {
    it('a vendor cannot read a product belonging to a different organization', async () => {
      const orgA = await createOrganization();
      const orgB = await createOrganization();
      const { token: tokenA, userId: userA } = await createVendorUserWithToken(orgA, ['VENDOR_MAKER']);
      const { token: tokenB } = await createVendorUserWithToken(orgB, ['VENDOR_MAKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(tokenA))
        .send(baseProductPayload());
      expect(created.status).toBe(201);

      const crossOrgRead = await request(app.getHttpServer())
        .get(`/catalog/products/${created.body.id}`)
        .set(authHeader(tokenB));
      expect(crossOrgRead.status).toBe(404);

      const sameOrgRead = await request(app.getHttpServer())
        .get(`/catalog/products/${created.body.id}`)
        .set(authHeader(tokenA));
      expect(sameOrgRead.status).toBe(200);
      expect(sameOrgRead.body.createdBy).toBe(userA);
    });
  });

  describe('full approval workflow with role enforcement (Part 3.1)', () => {
    it('creates, submits, and progresses a product through CHECKER and ADMIN stages to PUBLISHED', async () => {
      const org = await createOrganization({ requiresSecondApprover: true });
      const { token: makerToken } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);
      const { token: checkerToken } = await createVendorUserWithToken(org, ['VENDOR_CHECKER']);
      const { token: adminToken } = await createPlatformAdminWithToken();

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(makerToken))
        .send(baseProductPayload());
      expect(created.status).toBe(201);
      expect(created.body.status).toBe('DRAFT');
      const productId = created.body.id;

      const submitted = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/submit`)
        .set(authHeader(makerToken))
        .send({});
      expect(submitted.status).toBe(201);
      expect(submitted.body.status).toBe('PENDING_CHECKER');

      // A VENDOR_MAKER (no product.approve permission) cannot review.
      const makerReviewAttempt = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(makerToken))
        .send({ action: 'APPROVED' });
      expect(makerReviewAttempt.status).toBe(403);

      const checkerApproval = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(checkerToken))
        .send({ action: 'APPROVED' });
      expect(checkerApproval.status).toBe(201);
      expect(checkerApproval.body.status).toBe('PENDING_ADMIN');

      // A VENDOR_CHECKER cannot perform the ADMIN-stage review (wrong scope).
      const checkerAdminAttempt = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(checkerToken))
        .send({ action: 'APPROVED' });
      expect(checkerAdminAttempt.status).toBe(403);

      const adminApproval = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(adminToken))
        .send({ action: 'APPROVED' });
      expect(adminApproval.status).toBe(201);
      expect(adminApproval.body.status).toBe('APPROVED');

      // publish()/delist() are org-scoped vendor actions (Part 3.1 doesn't
      // designate them ADMIN-only — going live is separate from admin
      // approval itself), so the vendor's own token is used here, not the
      // platform admin's.
      const published = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/publish`)
        .set(authHeader(makerToken))
        .send();
      expect(published.status).toBe(201);
      expect(published.body.status).toBe('PUBLISHED');
      expect(published.body.publishedAt).not.toBeNull();
    });

    it('blocks self-approval at the CHECKER stage when the org requires a second approver', async () => {
      const org = await createOrganization({ requiresSecondApprover: true });
      // One person holding both roles is allowed (Part 2.12) — the block is
      // on approving your OWN submission, not on holding the combination.
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER', 'VENDOR_CHECKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload());
      await request(app.getHttpServer())
        .post(`/catalog/products/${created.body.id}/submit`)
        .set(authHeader(token))
        .send({});

      const selfApproval = await request(app.getHttpServer())
        .post(`/catalog/products/${created.body.id}/review`)
        .set(authHeader(token))
        .send({ action: 'APPROVED' });

      expect(selfApproval.status).toBe(403);
    });

    it('allows self-approval when the organization has requires_second_approver = false', async () => {
      const org = await createOrganization({ requiresSecondApprover: false });
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER', 'VENDOR_CHECKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload());
      await request(app.getHttpServer())
        .post(`/catalog/products/${created.body.id}/submit`)
        .set(authHeader(token))
        .send({});

      const selfApproval = await request(app.getHttpServer())
        .post(`/catalog/products/${created.body.id}/review`)
        .set(authHeader(token))
        .send({ action: 'APPROVED' });

      expect(selfApproval.status).toBe(201);
      expect(selfApproval.body.status).toBe('PENDING_ADMIN');
    });
  });

  describe('unit change safety (Part 4.1) — must never silently corrupt stock', () => {
    it('allows a unit change on a DRAFT product before any stock has been recorded', async () => {
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload({ unit: 'KG' }));
      expect(created.body.unit).toBe('KG');

      const updated = await request(app.getHttpServer())
        .patch(`/catalog/products/${created.body.id}`)
        .set(authHeader(token))
        .send({ unit: 'TON' });

      expect(updated.status).toBe(200);
      expect(updated.body.unit).toBe('TON');

      const inventory = await request(app.getHttpServer())
        .get(`/inventory/${created.body.id}`)
        .set(authHeader(token));
      expect(inventory.body.unit).toBe('TON');
    });

    it('refuses a unit change on a DRAFT product once real stock has been added via /inventory/:productId/adjust', async () => {
      // This is exactly the corruption path the bug report describes: the
      // adjust endpoint has no product-status gate, so a vendor can stock
      // up a DRAFT product before it is ever submitted, then change its
      // unit through PATCH — which must now be refused rather than
      // silently reinterpreting the existing quantity under a new unit.
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload({ unit: 'KG' }));
      const productId = created.body.id;

      const adjusted = await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(token))
        .send({ movementType: 'ADJUSTMENT', quantityChange: 500, notes: 'initial stock received' });
      expect(adjusted.status).toBe(201);

      const updateAttempt = await request(app.getHttpServer())
        .patch(`/catalog/products/${productId}`)
        .set(authHeader(token))
        .send({ unit: 'TON' });

      expect(updateAttempt.status).toBe(409);

      // Confirm nothing was corrupted: both the product's unit and the
      // inventory's quantity/unit are exactly what they were before the
      // refused request.
      const productCheck = await request(app.getHttpServer())
        .get(`/catalog/products/${productId}`)
        .set(authHeader(token));
      expect(productCheck.body.unit).toBe('KG');

      const inventoryCheck = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .set(authHeader(token));
      expect(inventoryCheck.body.unit).toBe('KG');
      expect(inventoryCheck.body.quantityAvailable).toBe('500.000');
    });

    it('refuses an ADMIN-approved unit change on a live PUBLISHED product that already has stock', async () => {
      const org = await createOrganization();
      const { token: makerToken } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);
      const { token: checkerToken } = await createVendorUserWithToken(org, ['VENDOR_CHECKER']);
      const { token: adminToken } = await createPlatformAdminWithToken();

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(makerToken))
        .send(baseProductPayload({ unit: 'KG' }));
      const productId = created.body.id;

      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/submit`)
        .set(authHeader(makerToken))
        .send({});
      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(checkerToken))
        .send({ action: 'APPROVED' });
      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(adminToken))
        .send({ action: 'APPROVED' });
      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/publish`)
        .set(authHeader(makerToken))
        .send();

      // Real stock arrives once the product is live.
      await request(app.getHttpServer())
        .post(`/inventory/${productId}/adjust`)
        .set(authHeader(makerToken))
        .send({ movementType: 'ADJUSTMENT', quantityChange: 750, notes: 'stock received after going live' });

      const editSubmit = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/submit`)
        .set(authHeader(makerToken))
        .send({ changes: { unit: 'TON' } });
      expect(editSubmit.status).toBe(201);
      expect(editSubmit.body.pendingStatus).toBe('PENDING_CHECKER');

      const checkerApproval = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(checkerToken))
        .send({ action: 'APPROVED' });
      expect(checkerApproval.status).toBe(201);
      expect(checkerApproval.body.pendingStatus).toBe('PENDING_ADMIN');

      const adminApproval = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/review`)
        .set(authHeader(adminToken))
        .send({ action: 'APPROVED' });

      expect(adminApproval.status).toBe(409);

      // The product is still PUBLISHED, still KG, and the pending edit is
      // untouched — the whole approval transaction rolled back rather
      // than applying every other field while corrupting the unit.
      const productCheck = await request(app.getHttpServer())
        .get(`/catalog/products/${productId}`)
        .set(authHeader(makerToken));
      expect(productCheck.body.status).toBe('PUBLISHED');
      expect(productCheck.body.unit).toBe('KG');
      expect(productCheck.body.pendingStatus).toBe('PENDING_ADMIN');

      const inventoryCheck = await request(app.getHttpServer())
        .get(`/inventory/${productId}`)
        .set(authHeader(makerToken));
      expect(inventoryCheck.body.unit).toBe('KG');
      expect(inventoryCheck.body.quantityAvailable).toBe('750.000');
    });
  });

  describe('price tier MOQ and gap validation at submit (Part 3.3)', () => {
    it('rejects submit when the first tier does not start at product.moq', async () => {
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload({ moq: 100 }));
      const productId = created.body.id;

      const tierResponse = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/price-tiers`)
        .set(authHeader(token))
        .send({ minQty: 150, unitPrice: 5 });
      expect(tierResponse.status).toBe(201);

      const submit = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/submit`)
        .set(authHeader(token))
        .send({});

      expect(submit.status).toBe(409);
    });

    it('rejects submit when there is a gap between tiers', async () => {
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload({ moq: 100 }));
      const productId = created.body.id;

      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/price-tiers`)
        .set(authHeader(token))
        .send({ minQty: 100, maxQty: 500, unitPrice: 10 });
      // Gap: next tier starts at 600, not 500.
      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/price-tiers`)
        .set(authHeader(token))
        .send({ minQty: 600, unitPrice: 8 });

      const submit = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/submit`)
        .set(authHeader(token))
        .send({});

      expect(submit.status).toBe(409);
    });

    it('allows submit when tiers start at moq and are gapless', async () => {
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload({ moq: 100 }));
      const productId = created.body.id;

      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/price-tiers`)
        .set(authHeader(token))
        .send({ minQty: 100, maxQty: 500, unitPrice: 10 });
      await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/price-tiers`)
        .set(authHeader(token))
        .send({ minQty: 500, unitPrice: 8 });

      const submit = await request(app.getHttpServer())
        .post(`/catalog/products/${productId}/submit`)
        .set(authHeader(token))
        .send({});

      expect(submit.status).toBe(201);
      expect(submit.body.status).toBe('PENDING_CHECKER');
    });
  });

  describe('target country H-16 validation', () => {
    it('rejects a target country the vendor has not declared, returns 400', async () => {
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload());
      const productId = created.body.id;

      const response = await request(app.getHttpServer())
        .put(`/catalog/products/${productId}/target-countries/US`)
        .set(authHeader(token))
        .send({ isAllowed: true });

      expect(response.status).toBe(400);
    });

    it('allows a target country once declared in vendor_target_country', async () => {
      const org = await createOrganization();
      const { token } = await createVendorUserWithToken(org, ['VENDOR_MAKER']);
      await dataSource.query(
        `INSERT INTO vendor_target_country (organization_id, target_country, target_currency) VALUES ($1, 'US', 'USD')`,
        [org],
      );

      const created = await request(app.getHttpServer())
        .post('/catalog/products')
        .set(authHeader(token))
        .send(baseProductPayload());
      const productId = created.body.id;

      const response = await request(app.getHttpServer())
        .put(`/catalog/products/${productId}/target-countries/US`)
        .set(authHeader(token))
        .send({ isAllowed: true });

      expect(response.status).toBe(200);
      expect(response.body.isAllowed).toBe(true);
    });
  });
});
