import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

// Boots the full AppModule, including the real DatabaseModule — this
// requires a reachable Postgres with migrations applied (see
// "npm run infra:up" + "npm run migration:run", and the "API" job in
// .github/workflows/ci.yml, which provisions both before this runs).
//
// A DatabaseModule mock was used here previously so e2e tests could run
// without any DB infrastructure. That stopped being possible once
// AuthModule (the first controller-bearing module needing a live
// DataSource) was added to AppModule — see app.module.ts's comment on
// AuthModule. If a future module needs to be tested without touching
// Postgres, prefer a focused unit test with a mocked repository over
// re-introducing a DatabaseModule-wide mock here.
describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors main.ts's global pipe — main.ts isn't executed in tests, so
    // the same ValidationPipe options are applied here explicitly.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
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
