# Export Marketplace API

The NestJS backend for Export Marketplace. REST API, versioned under `/api/v1`.

## Technology

- Node.js 22, NestJS 12, TypeScript
- PostgreSQL via TypeORM (migrations only — no `synchronize`)
- JWT auth (access + refresh tokens, HTTP-only refresh cookie), RBAC via roles/permissions
- AWS S3 (product image uploads via presigned URLs), backed by LocalStack locally
- Swagger/OpenAPI docs
- Vitest for unit and e2e tests, Oxlint for linting

## Implemented modules

```text
src/modules/
├── auth/              # Login, JWT issuance/refresh, RBAC guards
├── products/          # Admin product CRUD, images, price tiers
├── public-products/   # Public (unauthenticated) product catalogue
├── categories/
├── countries/
└── vendors/
```

Plus `src/aws/` (S3Service, LocalStack bootstrap) and `src/database/` (TypeORM entities and migrations).

## Getting started with Docker (recommended)

Run this from the **repository root**, not from `nest-server/`:

```bash
cp .env.docker.example .env
docker compose -f docker-compose.dev.yml up --build
```

This starts the API together with PostgreSQL and LocalStack, fully networked. The API will be at http://localhost:3005, with Swagger docs at http://localhost:3005/api/v1/docs. See the [root README](../README.md) for the full Docker workflow, environment variables, and service ports.

Run migrations once the stack is up:

```bash
docker compose -f docker-compose.dev.yml exec api npm run migration:run
```

## Getting started without Docker

Requires a reachable PostgreSQL instance (and, for upload features, an S3-compatible endpoint like LocalStack).

```bash
cd nest-server
npm ci
cp .env .env.local   # or edit .env directly — see variables below
npm run start:dev
```

The API listens on `PORT` (defaults to `3000` if unset; the committed `.env` sets `3001`).

### Environment variables

Set these in `nest-server/.env` (already present with local-dev defaults):

| Variable | Read by | Default if unset |
| --- | --- | --- |
| `PORT` | `main.ts` | `3000` |
| `CORS_ORIGIN` | `main.ts` | `http://localhost:3000` |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | `config/database.config.ts`, `database/data-source.ts` | `localhost:5432`, `postgres`/`postgres`/`export_marketplace` |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | `config/jwt.config.ts` | insecure dev-only placeholders (logs a warning if unset — **never rely on the fallback outside local dev**) |
| `AWS_REGION`, `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | `config/aws.config.ts` | `us-east-1`, unset endpoint (real AWS), `test`/`test` |
| `AWS_S3_PUBLIC_ENDPOINT` | `config/aws.config.ts` | unset — presigned URLs returned unmodified |
| `ENABLE_AWS_DEMO_ROUTES` | `aws/aws-demo.controller.ts` | `false` — unauthenticated demo routes, dev only |
| `STORAGE_PROVIDER` | `storage/storage.module.ts` | `s3` — set to `cloudinary` to use Cloudinary instead (see below) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | `config/cloudinary.config.ts` | unset — only required when `STORAGE_PROVIDER=cloudinary`; the app fails fast at startup if any are missing while Cloudinary is selected |

### Switching the product-image storage provider

Product image uploads go through a `StorageStrategy` abstraction
(`src/storage/`) instead of talking to S3 directly, so the backing provider
is a one-variable switch:

- `STORAGE_PROVIDER=s3` (default) — presigned S3 PUT URLs via `S3Service`,
  unchanged. Works against LocalStack locally and real AWS in production.
- `STORAGE_PROVIDER=cloudinary` — Cloudinary signed uploads. Requires
  `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` (free
  plan is sufficient). No endpoint/API changes: `POST .../upload-url`,
  `POST .../images`, and `DELETE .../images/:id` behave identically from the
  client's point of view — only where the bytes end up differs.

Note: existing `ProductImage` rows don't record which provider stored them
(no schema change was made for this). If you switch `STORAGE_PROVIDER` after
images already exist, new uploads go to the new provider, but deleting an
old image will call the *currently active* strategy, which only works if it
matches whichever provider actually stored that image. This is fine for the
intended use (S3 in local/production, Cloudinary only in a dev environment
that doesn't carry images across the switch) but would need a `provider`
column added to `product_images` if provider ever needs to vary per-row in
a long-lived environment.

Database and JWT variable names matter: the API reads `DB_*`/`JWT_*` (not `POSTGRES_*`/`AUTH_*`) — the Docker Compose files inject the right names for you, but if you're setting these manually (e.g. in a hosting provider's dashboard), use the exact names above.

## Database migrations

Schema changes only ever happen through migrations — `synchronize` is always `false`.

```bash
npm run migration:run       # Apply pending migrations
npm run migration:revert    # Roll back the last migration
npm run migration:generate -- src/database/migrations/<Name>   # Diff entities against the current schema
```

## Commands

```bash
npm run start        # Start the API
npm run start:dev    # Start with file watching
npm run start:debug  # Start with debugging and file watching
npm run build        # Compile to dist/
npm run start:prod   # Run the compiled API (node dist/main.js)
npm run lint         # Lint with Oxlint
npm test             # Unit tests (Vitest)
npm run test:e2e     # End-to-end tests
npm run test:cov     # Tests with coverage
```

## API docs

Swagger/OpenAPI UI is served at `/api/v1/docs` in every environment.

## CORS

`main.ts` calls `app.enableCors()` with `credentials: true` (required for the HTTP-only refresh-token cookie) and an origin controlled by `CORS_ORIGIN` (comma-separated for multiple origins). Set this to wherever the web app is actually served — it defaults to `http://localhost:3000`.

## Security notes

- `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` fall back to hardcoded insecure values if unset, logging a warning on boot. Set real random secrets (`openssl rand -hex 32`) in any shared or production environment.
- `synchronize` is intentionally always `false` — schema changes go through migrations only.
- The production Docker Compose stack (`docker-compose.yml`, repo root) refuses to start unless `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` are explicitly set.

## CI

See [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — runs lint, unit tests, e2e tests, and build on every push/PR. Run the same locally before opening a PR:

```bash
npm run lint && npm test && npm run test:e2e && npm run build
```

See the [repository root README](../README.md) for the full product overview and Docker setup shared with the web app.

## License

Marked `UNLICENSED`. See [LICENSE](../LICENSE).
