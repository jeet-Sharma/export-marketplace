# Export Marketplace

> A B2B platform for connecting international buyers with exporters, manufacturers, and suppliers.

Export Marketplace helps businesses discover export-ready products and move from supplier discovery to quotation, ordering, payment, documentation, and delivery.

This repository is a monorepo with two independently deployable apps:

```text
export-marketplace/
├── nest-server/     # NestJS 12 REST API (TypeScript, PostgreSQL, AWS S3)
├── react-client/    # Next.js 16 web application (TypeScript, Tailwind CSS)
├── docker-compose.yml       # Production-style stack
├── docker-compose.dev.yml   # Development stack with hot reload
└── .env.docker.example      # Template for the root .env Compose reads
```

Each app has its own README with setup details specific to it:

- [`nest-server/README.md`](nest-server/README.md) — API setup, environment variables, migrations, auth/AWS modules.
- [`react-client/README.md`](react-client/README.md) — Web app setup, environment variables.

## Current status

### Implemented

- NestJS API with:
  - JWT-based authentication (access + refresh tokens, HTTP-only refresh cookie, RBAC via roles/permissions).
  - PostgreSQL persistence via TypeORM, with migrations (no `synchronize`).
  - Products, categories, countries, vendors, and public product catalogue modules.
  - Product image upload flow via S3 presigned URLs, with LocalStack for local dev.
  - Swagger/OpenAPI docs at `/api/v1/docs`.
  - Global validation, consistent error envelope, CORS.
- Next.js web application foundation (App Router, React 19, Tailwind CSS 4). Marketplace UI (buyer/seller/admin workflows) is not yet built out.
- Docker Compose stacks (dev + production-style) for both apps plus PostgreSQL and LocalStack.
- GitHub Actions CI for linting, tests, and builds.

### Planned

- Buyer/seller/admin frontend workflows (RFQs, quotations, orders, payments, documents, messaging).
- MongoDB for flexible/high-volume data (messaging, notifications, activity logs) — not wired in yet.
- Production AWS deployment (real S3 instead of LocalStack).
- SQS integration for async events (planned, not yet implemented).

## Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) 24+ with the Compose v2 plugin (`docker compose`), **or**
- Node.js 22+ and npm, if running each app natively without Docker.

## Quickest start: Docker (recommended)

This runs both apps plus PostgreSQL and LocalStack (S3 emulation) together, fully networked.

```bash
cp .env.docker.example .env
docker compose -f docker-compose.dev.yml up --build
```

- Web: http://localhost:3000
- API: http://localhost:3005
- API docs (Swagger): http://localhost:3005/api/v1/docs
- PostgreSQL: `localhost:55432`
- LocalStack: `localhost:4566`

The `.env` file is optional for a first run — every variable has a safe development default. See [Environment variables](#environment-variables) below if you need to change ports, secrets, or AWS settings.

First time only — run database migrations inside the running `api` container:

```bash
docker compose -f docker-compose.dev.yml exec api npm run migration:run
```

Stop the stack:

```bash
docker compose -f docker-compose.dev.yml down
# add -v to also delete the Postgres/LocalStack data volumes
```

### Production-style build

Builds an optimized pruned NestJS image and a Next.js standalone image instead of running dev servers with hot reload.

```bash
cp .env.docker.example .env
# Edit .env: POSTGRES_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET are
# REQUIRED here and must be set to strong, unique values.
docker compose up -d --build
docker compose exec api npm run migration:run
```

### Service overview

| Service      | Image / build             | Container port | Host port (default) |
| ------------ | -------------------------- | --------------- | -------------------- |
| `web`        | `react-client/Dockerfile*` | 3000             | 3000                  |
| `api`        | `nest-server/Dockerfile*`  | 3005             | 3005                  |
| `postgres`   | `postgres:16-alpine`       | 5432             | 55432                 |
| `localstack` | `localstack/localstack`    | 4566             | 4566                  |

Inside the Docker network, the `api` container reaches other services by name (`postgres`, `http://localstack:4566`), never `localhost`. The browser reaches the API through the published host port via `NEXT_PUBLIC_API_URL`.

### Common Docker commands

```bash
docker compose -f docker-compose.dev.yml logs -f api   # Tail API logs
docker compose -f docker-compose.dev.yml logs -f web   # Tail web logs
docker compose -f docker-compose.dev.yml ps             # List running services
docker compose -f docker-compose.dev.yml down           # Stop and remove containers
docker compose -f docker-compose.dev.yml down -v        # Also remove data volumes
```

(Drop `-f docker-compose.dev.yml` to target the production-style stack instead.)

## Environment variables

Copy `.env.docker.example` to `.env` at the repository root — Docker Compose loads it automatically. Key variables:

| Variable | Used by | Notes |
| --- | --- | --- |
| `API_HOST_PORT`, `WEB_HOST_PORT`, `POSTGRES_HOST_PORT`, `LOCALSTACK_HOST_PORT` | Compose | Change if a port is already taken on your machine. |
| `NEXT_PUBLIC_API_URL` | `web` | Browser-facing API base URL. Baked into the Next.js build at build time in production. |
| `CORS_ORIGIN` | `api` | Origin(s) allowed to make credentialed cross-origin requests (the web app's origin). Comma-separate multiple origins. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | `postgres`, `api` | **Required** in the production stack. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | `api` | **Required** in the production stack — must be strong random values (e.g. `openssl rand -hex 32`), different from each other. |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | `api` | AWS/LocalStack config. Defaults work out of the box with LocalStack. |
| `AWS_S3_PUBLIC_ENDPOINT` | `api` | Signs presigned S3 URLs against this host-reachable endpoint instead of the internal LocalStack address, so a browser outside the Docker network can use them. Dev stack sets this automatically. |
| `ENABLE_AWS_DEMO_ROUTES` | `api` | Enables unauthenticated `/aws-demo` helper routes. Dev stack only — never set in production. |

See [`.env.docker.example`](.env.docker.example) for the full annotated list.

## Running without Docker

Each app can run natively against its own `.env` file. See the per-app READMEs:

- [`nest-server/README.md`](nest-server/README.md#getting-started-without-docker)
- [`react-client/README.md`](react-client/README.md#getting-started-without-docker)

You'll still need a PostgreSQL instance and, if testing file uploads, an S3-compatible service (LocalStack) reachable at the hosts configured in `nest-server/.env`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes and pull requests:

- API linting, unit tests, end-to-end tests, and build.
- Web application linting and production build.

Run the same checks locally before opening a pull request — see each app's README for commands.

## Contributing

1. Create or switch to the appropriate branch.
2. Keep changes focused; run lint/test/build locally before opening a PR.
3. Never commit secrets, `.env` files, or generated dependencies.
4. Open a pull request with a clear summary and testing notes.

## License

This project is marked `UNLICENSED` in the API package configuration. Refer to [LICENSE](LICENSE) before distributing the software.
