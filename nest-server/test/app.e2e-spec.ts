import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { DatabaseModule } from '../src/modules/database/database.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Replace the real DatabaseModule (which needs a live Postgres) with an
      // empty no-op module so e2e tests run without any DB infrastructure.
      .overrideModule(DatabaseModule)
      .useModule({ module: class DatabaseModuleMock {} })
      .compile();

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
