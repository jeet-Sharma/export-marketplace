import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

// Runs against a real Postgres instance (see db.config.ts / DatabaseModule)
// with the schema already migrated — same as running the app normally
// (docker-compose's postgres service locally, a dedicated Postgres service
// in CI; see .github/workflows/ci.yml). No DatabaseModule override: every
// domain entity (Identity, Reference Data, Catalog, Inventory) uses
// Postgres-specific column types (char, jsonb, numeric with precision,
// generated/STORED columns) that an in-memory SQLite substitute cannot
// represent, and `synchronize` is hard-disabled everywhere (db.config.ts)
// because the schema is owned by migrations, not entity auto-sync.
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 15000);

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
