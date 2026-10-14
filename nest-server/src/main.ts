import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule, ObserveInstrument } from './app.module.js';
import { validationExceptionFactory } from './common/validation/validation-exception-factory.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

const API_PREFIX = 'api/v1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // Per Phase-1-API-Specification-v0.1 section 2 ("Base URL: /api/v1").
  app.setGlobalPrefix(API_PREFIX);

  // The web client (Next.js) runs on a different origin/port than the API
  // (e.g. http://localhost:3000 vs http://localhost:3005), and AuthController
  // sets an HTTP-only refresh-token cookie — so credentialed cross-origin
  // requests need CORS explicitly enabled with credentials allowed.
  // CORS_ORIGIN accepts a single origin or a comma-separated list.
  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  app.enableCors({
    origin: corsOrigin
      ? corsOrigin.split(',').map((o) => o.trim())
      : 'http://localhost:3000',
    credentials: true,
  });

  // Required to read the HTTP-only refresh-token cookie set by
  // AuthController — see src/modules/auth/auth.controller.ts.
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Builds the error envelope's {code, message, errors} body
      // directly from the real field names, instead of letting Nest's
      // default factory collapse everything into an unlabeled string[]
      // — see validation-exception-factory.ts.
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // Normalizes every error response into the consistent envelope from
  // API spec section 13 — see HttpExceptionFilter for the exact shapes handled.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger/OpenAPI docs. SwaggerModule.setup() does NOT respect
  // app.setGlobalPrefix() (it mounts its own route independently of
  // Nest's controller routing), so the docs path is built from the same
  // API_PREFIX constant explicitly rather than drifting out of sync with
  // it. Kept enabled in all environments for now — revisit if the API
  // should be gated or hidden in production.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Export Marketplace API')
    .setDescription(
      'Phase 1 REST API for the Export Marketplace Platform — Platform User ' +
        'authentication, product management, vendor/category/country reference ' +
        'data, product images, bulk pricing, and the public product catalogue. ' +
        'See Phase-1-API-Specification-v0.1 for the full contract.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
