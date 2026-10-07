import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule, ObserveInstrument } from './app.module.js';
import { validationExceptionFactory } from './common/validation/validation-exception-factory.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // Per Phase-1-API-Specification-v0.1 section 2 ("Base URL: /api/v1").
  app.setGlobalPrefix('api/v1');

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

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
