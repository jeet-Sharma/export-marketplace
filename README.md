# Export Marketplace

> A production-oriented B2B platform for connecting international buyers with exporters, manufacturers, and suppliers.

Export Marketplace is being designed to help businesses discover export-ready products and move from supplier discovery to quotation, negotiation, ordering, payment, documentation, compliance, shipment, and delivery in one workflow.

The repository currently contains the initial web and API foundations. Marketplace business modules, database integrations, authentication, and transactional workflows are planned and are not yet implemented.

## Product Vision

The platform will support three primary audiences:

- **Buyers and importers** looking for products, suppliers, quotations, and shipment visibility.
- **Sellers and exporters** managing company profiles, products, RFQs, quotations, orders, documents, and team members.
- **Administrators** managing users, company verification, marketplace content, compliance, disputes, and operational analytics.

Logistics providers are a future, optional role and are not part of the current MVP implementation.

## Core Business Flow

The planned marketplace workflow is:

```text
Search products
	-> Find a supplier
	-> Create an RFQ
	-> Receive quotations
	-> Negotiate terms
	-> Accept a quotation
	-> Create an order
	-> Complete payment
	-> Process and ship goods
	-> Manage customs and documents
	-> Deliver the order
	-> Review the supplier
```

## Current Status

### Implemented

- Next.js web application foundation using the App Router, React, TypeScript, and Tailwind CSS.
- NestJS API foundation using TypeScript.
- Basic NestJS application module, controller, and service.
- Root API response at `GET /` returning the starter response.
- Unit and end-to-end test setup with Vitest for the API.
- ESLint for the web application and Oxlint for the API.
- Production build scripts for both applications.
- GitHub Actions CI for API and web linting, tests, and builds.

### Planned

- Buyer, seller, and administrator authentication and role-based access control.
- Company profiles, members, verification, and supplier discovery.
- Product catalog, categories, variants, inventory, pricing, and export metadata.
- RFQs, quotations, comparison, negotiation, and messaging.
- Orders, invoices, payments, documents, compliance, and disputes.
- Shipment tracking, notifications, analytics, and operational administration.
- PostgreSQL and MongoDB persistence, object storage, background jobs, and production infrastructure.

## Technology Stack

### Web Application

- Next.js 16
- React 19
- TypeScript
- Next.js App Router
- Tailwind CSS

### API

- Node.js
- NestJS 12
- TypeScript
- REST API initially
- WebSockets planned for messaging and realtime notifications

### Planned Data Layer

The intended data architecture is:

- **PostgreSQL** as the primary transactional source of truth for users, companies, products, RFQs, quotations, orders, payments, invoices, shipments, compliance, and other business-critical records.
- **MongoDB** for flexible and high-volume data such as conversations, messages, notifications, activity logs, audit events, flexible drafts, and selected search or recommendation data.

Neither database is wired into the current application yet. MongoDB is not intended to replace PostgreSQL as the primary transactional database.

## Architecture

The initial system will use a **NestJS modular monolith**. This keeps business logic cohesive while leaving clear boundaries for extracting independently scalable services later if the product requires it. The project is not currently a microservices architecture.

```text
						 Next.js Web Application
					Buyer | Seller | Admin Portals
								  |
						 REST / WebSocket API
								  |
					NestJS Modular Monolith API
								  |
				 PostgreSQL                MongoDB
		  Transactional business data   Flexible activity data
```

## Planned Backend Modules

The API is expected to grow around business modules such as:

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

These are planned boundaries. They should be added as the related features are implemented rather than represented as empty modules.

## Planned Marketplace Capabilities

### Products and Suppliers

Products are expected to support descriptions, categories, images, specifications, variants, pricing, minimum order quantities, packaging, country of origin, HS codes, certifications, export markets, payment terms, and Incoterms. Exact fields will be finalized with the domain model.

### Requests for Quotation

Buyers will be able to submit product requirements, quantities, destinations, delivery dates, packaging requirements, Incoterms, payment terms, and additional conditions to relevant suppliers.

### Quotations and Negotiation

Suppliers will be able to respond with unit prices, quantities, shipping and insurance costs, Incoterms, payment terms, delivery estimates, totals, and additional terms. Buyers will eventually be able to compare quotations and negotiate through messaging.

### Orders and Payments

The planned order lifecycle includes draft, payment, confirmation, processing, shipping, customs, delivery, completion, cancellation, and dispute states. Payment integrations will remain provider-independent and may support bank transfer, wire transfer, letters of credit, cards, escrow, and external providers. No payment provider is integrated today.

### Documents and Compliance

The platform will eventually manage metadata and references for commercial invoices, proforma invoices, packing lists, certificates of origin, bills of lading, airway bills, insurance certificates, inspection certificates, customs documents, purchase orders, and sales contracts. Actual files should be stored in S3-compatible object storage, with document metadata held in the application databases.

Compliance capabilities may include company verification, KYC, business registration, tax information, export licenses, certifications, product compliance, HS codes, country restrictions, and document verification.

### Logistics

Future shipment support may include origin, destination, carrier, container, tracking number, documents, and status transitions such as booked, picked up, at port, loaded, in transit, arrived, customs, and delivered.

## Repository Structure

The repository currently uses separate application directories:

```text
export-marketplace/
├── .github/
│   └── workflows/
│       └── ci.yml
├── nest-server/              # NestJS API
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── package-lock.json
├── react-client/             # Next.js web application
│   ├── public/
│   ├── src/app/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
├── LICENSE
└── README.md
```

The repository is not currently organized as a workspace with `apps/` and `packages/` directories. That structure remains a possible future evolution as shared UI, types, validation, and configuration packages become necessary.

## Getting Started

### Prerequisites

- Node.js 24 or a compatible current Node.js release.
- npm.

### Run the API

```bash
cd nest-server
npm ci
npm run start:dev
```

The API starts on port `3000` by default. The current root endpoint is available at [http://localhost:3000](http://localhost:3000).

### Run the web application

Open a second terminal:

```bash
cd react-client
npm ci
npm run dev
```

The web application is available at [http://localhost:3000](http://localhost:3000) by default. If both applications run at the same time, assign one of them a different port.

## Development Commands

### API

```bash
cd nest-server
npm run lint        # Lint source and test files
npm test            # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run build       # Build the API
```

### Web Application

```bash
cd react-client
npm run lint        # Lint the Next.js application
npm run build       # Create a production build
npm run start       # Serve a production build
```

## API Direction

The API will be versioned as the domain grows, using routes such as:

```text
/api/v1/auth
/api/v1/users
/api/v1/companies
/api/v1/products
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

REST is the initial integration style. WebSockets may be added for messaging and realtime notifications where they provide clear user value.

## Security Principles

Security is a first-class product requirement. Planned and ongoing practices include:

- Authentication, authorization, RBAC, and explicit permission checks.
- DTO validation and consistent API error handling.
- Secure password hashing and refresh-token or session security.
- Rate limiting, security headers, CORS configuration, and API protection.
- File upload validation and malware-scanning integration where required.
- Audit logging and controlled access to sensitive business data.
- Environment variables and managed secrets instead of committed credentials.
- Server-side validation of IDs, roles, prices, payment states, and order states.
- Database authorization and least-privilege access.

The current NestJS Observe configuration contains placeholder credentials and must be configured securely before production use.

## Development Principles

1. Use TypeScript-first development.
2. Keep frontend and backend responsibilities clearly separated.
3. Keep controllers thin and business logic in services or use cases.
4. Treat PostgreSQL as the source of truth for transactional business data.
5. Use MongoDB for flexible or high-volume data, not primary transactions.
6. Prefer modular monolith boundaries before considering microservices.
7. Use automated tests and CI for every change.
8. Use environment variables for configuration and secrets.
9. Prefer asynchronous jobs for expensive or background operations.
10. Maintain versioned APIs, structured logging, and consistent error handling.

## Roadmap

### Phase 1: Foundation

- Establish the web and API applications.
- Define domain boundaries and API conventions.
- Add environment configuration and local development documentation.
- Introduce database migrations and persistence foundations.

### Phase 2: Identity and Companies

- Add registration, login, sessions, RBAC, and permissions.
- Add company profiles, members, addresses, and verification workflows.

### Phase 3: Marketplace

- Add categories, products, suppliers, product media, inventory, and search.
- Add buyer and seller portal workflows.

### Phase 4: RFQs and Commercial Workflow

- Add RFQs, quotations, quotation comparison, negotiation, and messaging.
- Add order creation, invoices, payment states, and audit events.

### Phase 5: Trade Operations

- Add export documents, compliance, certifications, shipment tracking, and notifications.
- Add administrator operations, disputes, reviews, and analytics.

### Phase 6: Production Readiness

- Add object storage, background jobs, observability, backups, deployment automation, and performance testing.
- Evaluate extraction of selected modules into services only when real scale or ownership boundaries justify it.

## Branches and Delivery

The repository currently maintains these branches for development and release coordination:

- `main`: shared default branch and production-ready baseline.
- `master`: compatibility release branch.
- `develop`: integration branch for completed work.
- `staging`: pre-release validation.
- `preproduction`: pre-production validation environment.
- `production`: production release branch.
- `feature`: feature development branch.
- `rajat` and `baba`: contributor or workstream branches.

New work should normally be developed on a dedicated feature branch and merged through review into the appropriate integration or release branch.

## Continuous Integration

GitHub Actions is configured in `.github/workflows/ci.yml` and runs on pushes and pull requests. It currently checks:

- API linting, unit tests, end-to-end tests, and build.
- Web application linting and production build.

## Contributing

1. Create or switch to the appropriate branch.
2. Keep changes focused and document new domain decisions.
3. Run the relevant lint, test, and build commands locally.
4. Do not commit secrets, credentials, generated dependencies, or local environment files.
5. Open a pull request with a clear summary, testing notes, and any migration or deployment considerations.

## License

This project is currently marked as `UNLICENSED` in the API package configuration. Refer to [LICENSE](LICENSE) for the repository license file and confirm licensing terms before distributing the software.