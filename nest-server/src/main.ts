import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  // Global request-body validation via class-validator/class-transformer,
  // introduced for POST /auth/register's RegisterBuyerDto. Applies to every
  // controller from here on — see backend-rules.md: this is an
  // architectural addition, not a per-DTO opt-in, and existing DTOs
  // (storage/messaging) intentionally stay plain classes since they don't
  // use class-validator decorators, so this pipe has nothing to enforce on
  // them and is a no-op for those routes.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on the DTO
      forbidNonWhitelisted: true, // reject requests that send extra fields, instead of silently dropping them
      transform: true, // let @Type()/implicit conversions run so controllers receive real typed DTO instances
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
