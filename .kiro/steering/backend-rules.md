---
inclusion: fileMatch
fileMatchPattern: 'nest-server/**'
---

# Backend Rules — nest-server (NestJS)

Confirmed stack (from `package.json`): NestJS ^12.0.1, TypeScript ^6.0.2,
`"type": "module"` (ESM), Vitest for tests, Oxlint for linting, Prettier
(`singleQuote: true, trailingComma: "all"`). AWS SDK v3 for S3/SQS.
**Confirmed absent: no database/ORM (no TypeORM/Prisma/Mongoose/pg), no
authentication/authorization (no guards/passport/JWT/bcrypt), no
class-validator/class-transformer, no custom exception filters.** Don't
assume any of these exist — check `marketplace-domain.md` before adding
them, since the domain model and auth model are architecturally
significant decisions, not incidental ones.

## ESM — non-negotiable, already enforced

Every relative import must use an explicit `.js` extension, even though
the source file is `.ts` — this is required by `"type": "module"` +
`moduleResolution: nodenext`, not a style preference:

```ts
import { AppService } from './app.service.js';   // correct
import { AppService } from './app.service';      // will fail at runtime
```

This applies to every new file without exception.

## Module structure

New backend capabilities go under `src/modules/<name>/` following the
shape already used by `storage/` and `messaging/`:
```
modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
└── dto/
    └── <thing>.dto.ts
```
Cross-cutting configuration lives in `src/config/` (currently
`aws.config.ts` + `config.module.ts`), not scattered per-module.

- **Controllers stay thin.** They validate presence of required
  params/body fields (throwing `BadRequestException` directly — see
  `storage.controller.ts`, `messaging.controller.ts`) and delegate
  everything else to a service. Don't put business logic, AWS SDK calls,
  or data shaping in a controller.
- **Services own the actual logic**, injected via constructor DI. Shared
  infrastructure clients (S3Client, SQSClient) are provided through a
  dedicated module (`src/modules/aws/aws-clients.module.ts`) behind
  `Symbol()` DI tokens (`S3_CLIENT`, `SQS_CLIENT` in
  `aws-clients.tokens.ts`), injected with `@Inject(TOKEN)`. Follow this
  token pattern for any other shared external client added later, rather
  than instantiating SDK clients inline inside a service.

## Configuration — `ConfigService` only

Read configuration exclusively through `ConfigService`, never raw
`process.env` outside `src/config/`. New environment-driven settings get a
`registerAs('<namespace>', () => ({...}))` factory (see `aws.config.ts`)
with safe defaults using `??`/`||`, then get loaded into
`AppConfigModule`'s `ConfigModule.forRoot({ load: [...] })`. Do not add a
strict/throwing env validator that hard-requires variables the config
factory can already default safely — this was tried and reverted (the
CI/test suite has no `.env` file and must still boot); rely on the
factory's own defaults instead of a separate validation gate.

## Don't hard-fail app boot on optional external dependencies

If a service depends on something that might not be running locally (the
established example: LocalStack for S3/SQS), follow the pattern in
`StorageService`/`MessagingService`:
- Implement `OnModuleInit`, attempt the real connectivity check
  (`ensureBucketExists`/`resolveQueueUrl`), and on failure `Logger.warn(...)`
  with a clear remediation hint instead of letting the error propagate and
  crash the whole Nest app.
- Track an `available` boolean; every public method calls a private
  `assertAvailable()` that throws `ServiceUnavailableException` if the
  dependency never came up. This means unrelated routes keep working even
  when this one dependency is down, and callers of *this* service get a
  clean, informative 503 instead of a raw SDK error or app crash.

## LocalStack

`docker-compose.yml` runs S3 + SQS via LocalStack, deliberately pinned to
`localstack/localstack:4.4.0` — the last tag that runs without a LocalStack
account/auth token (LocalStack started requiring one from the `2026.03.0`
release onward; see the comment in `docker-compose.yml` before bumping the
version, and don't bump it without also adding `LOCALSTACK_AUTH_TOKEN`
handling). `npm run localstack:up` is optional for the app to boot — never
make it a hard requirement (see the OnModuleInit pattern above).

## Exception handling and logging

- No custom exception classes or global exception filters exist yet.
  Built-in Nest exceptions (`BadRequestException`, `ServiceUnavailableException`,
  etc.) are used directly and are sufficient for the current scope. If a
  future module needs a domain-specific exception (e.g. an "insufficient
  inventory" error), check whether an existing Nest HTTP exception already
  fits before introducing a custom exception hierarchy.
- Use Nest's built-in `Logger` (`new Logger(ClassName.name)`), as already
  done in `StorageService`/`MessagingService`. No external logging library
  is installed — don't add one without a specific need (structured JSON
  logs for a log aggregator, etc.) that `Logger` can't satisfy.
- Never log secrets, credentials, or full request/response bodies that
  might contain them — see `security-rules.md`.

## DTOs — currently plain classes, no validation library

DTOs are plain TypeScript classes with definite-assignment assertions
(`field!: string`), e.g. `UploadFileResponseDto`, `PublishMessageDto`. No
`class-validator`/`class-transformer` is installed —
`publish-message.dto.ts` has an explicit comment noting this. Do not
silently add `class-validator` decorators to one DTO while others stay
plain; if request validation needs to be enforced at the framework level
(rather than manual `if (!x) throw new BadRequestException()` checks, as
done today), that's an architectural addition — flag it and confirm before
introducing the library, since it implies adding a global `ValidationPipe`
in `main.ts` too and should be applied consistently, not per-DTO.

## Testing

Two starter specs exist: `src/app.controller.spec.ts` (unit) and
`test/app.e2e-spec.ts` (e2e, boots the full `AppModule` via
`@nestjs/testing` + `supertest`). **No tests exist yet for `storage` or
`messaging`.** See `testing-rules.md` for what to add when touching these
modules.

## What NOT to assume

Do not write code, comments, or DTOs that assume any of the following
exist unless you are the one adding them in this change: a database
connection, an ORM/query builder, a repository layer, an authenticated
request context (`req.user`), a guard/decorator like `@Roles()` or
`@CurrentUser()`, or a message queue consumer beyond the manual
`MessagingController.publish` endpoint that already exists.
