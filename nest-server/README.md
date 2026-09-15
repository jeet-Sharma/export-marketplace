# Export Marketplace API

The API is the NestJS backend for Export Marketplace, a planned B2B platform connecting international buyers with exporters, manufacturers, and suppliers.

It will own business rules and transactional workflows for companies, products, RFQs, quotations, orders, payments, documents, compliance, and shipments. Messaging, notifications, activity history, and other flexible high-volume data may use MongoDB as the product evolves.

The current API is the initial NestJS foundation. It contains the starter application module, a root controller and service, test coverage, and NestJS Observe instrumentation configuration. The marketplace domain modules and database integrations are planned, not yet implemented.

## Technology

- Node.js
- NestJS 12
- TypeScript
- REST API initially
- WebSocket support planned for messaging and realtime notifications
- Vitest for unit and end-to-end tests
- Oxlint for source and test linting

## Architecture Direction

The application will begin as a **modular monolith**, not a microservices system. Business capabilities will be separated into NestJS modules so that individual modules can be extracted later if scale, ownership, or deployment needs justify it.

Planned module boundaries include:

```text
auth/                 users/                companies/
company-members/      marketplace/          rfq/
quotations/           negotiation/          orders/
payments/             invoices/             inventory/
shipping/             logistics/            documents/
compliance/           certifications/       reviews/
disputes/             messaging/            notifications/
search/               analytics/            admin/
```

These directories are planned boundaries, not a claim that all modules currently exist.

## Data Architecture

- **PostgreSQL** is planned as the primary transactional source of truth for users, companies, products, RFQs, quotations, orders, payments, invoices, shipments, documents, compliance, reviews, and disputes.
- **MongoDB** is planned for conversations, messages, notifications, activity logs, audit events, flexible product drafts, and selected search or recommendation data.
- Object storage such as S3-compatible storage is planned for document files. Database records should store document metadata and object references.

No PostgreSQL or MongoDB integration is present in the current codebase.

## Current API

The current root endpoint is:

```text
GET /
```

It returns the starter response `Hello World!`. The API listens on port `3000` by default and can be configured with the `PORT` environment variable.

## Project Structure

```text
nest-server/
├── src/
│   ├── app.controller.ts       # Current root controller
│   ├── app.controller.spec.ts  # Unit test
│   ├── app.module.ts            # Root module and Observe setup
│   ├── app.service.ts           # Current root service
│   └── main.ts                  # Application bootstrap
├── test/
│   └── app.e2e-spec.ts          # End-to-end test
├── package.json
├── package-lock.json
├── tsconfig.json
└── vitest.config*.ts
```

## Getting Started

From the repository root:

```bash
cd nest-server
npm ci
npm run start:dev
```

The API is available at [http://localhost:3000](http://localhost:3000) by default.

## Commands

```bash
npm run start       # Start the API
npm run start:dev   # Start with file watching
npm run start:debug # Start with debugging and file watching
npm run build       # Compile the API to dist/
npm run start:prod  # Run the compiled API
```

## Tests and Linting

```bash
npm run lint        # Lint source and test files with Oxlint
npm test            # Run unit tests with Vitest
npm run test:e2e    # Run end-to-end tests
npm run test:cov    # Run tests with coverage
```

The current tests cover the starter controller and root HTTP response. New domain modules should add focused unit tests and end-to-end coverage for their public API behavior.

## API Direction

The API will be versioned under routes such as:

```text
/api/v1/auth
/api/v1/users
/api/v1/companies
/api/v1/products
/api/v1/categories
/api/v1/suppliers
/api/v1/rfqs
/api/v1/quotations
/api/v1/orders
/api/v1/payments
/api/v1/shipments
/api/v1/documents
/api/v1/messages
/api/v1/notifications
```

REST is the initial integration style. WebSockets may be added for messaging and notifications where realtime behavior is required.

## Security Requirements

Planned backend security practices include authentication, authorization, RBAC, explicit permission checks, DTO validation, rate limiting, secure password hashing, refresh-token or session security, security headers, CORS configuration, file upload validation, audit logging, managed secrets, and least-privilege database access.

Business-sensitive values must always be validated server-side. The API must never trust IDs, roles, prices, payment states, or order states supplied by the frontend.

## Observability

The project currently includes `@nestjs/observe` instrumentation in the root module. Its `appKey` and `appSecret` are placeholders and must be supplied through secure configuration before production use. Credentials must never be committed to the repository.

## CI

The repository workflow runs API linting, unit tests, end-to-end tests, and the production build on pushes and pull requests.

Run the same checks locally before opening a pull request:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

See the repository root [README](../README.md) for the complete product vision, frontend overview, roadmap, branch strategy, and contribution workflow.

## License

This package is currently marked as `UNLICENSED`. Refer to the repository [LICENSE](../LICENSE) file before distributing the software.
