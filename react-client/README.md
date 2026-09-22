# Export Marketplace Web Application

The web application is the Next.js frontend for Export Marketplace, a planned B2B platform connecting international buyers with exporters, manufacturers, and suppliers.

The frontend will eventually provide dedicated experiences for:

- Buyers discovering products and suppliers, creating RFQs, comparing quotations, managing orders, and tracking shipments.
- Sellers managing company profiles, products, inventory, RFQs, quotations, orders, documents, and team members.
- Administrators managing users, companies, marketplace content, compliance, disputes, and operational analytics.

The current application is the initial frontend foundation. It uses the default starter screen while the marketplace workflows and shared product design system are being built.

## Technology

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint with the Next.js configuration
- React Compiler enabled in `next.config.ts`

## Project Structure

```text
react-client/
├── public/             # Static assets
├── src/app/
│   ├── layout.tsx      # Root layout and metadata
│   ├── page.tsx        # Current home page
│   └── globals.css     # Global styles
├── eslint.config.mjs
├── next.config.ts
├── package.json
└── package-lock.json
```

As the product grows, route groups and feature modules can be introduced for buyer, seller, and admin portals without coupling the UI to backend implementation details.

## Getting Started

From the repository root:

```bash
cd react-client
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. If the NestJS API is running on the same port, start one application on another port:

```bash
npm run dev -- --port 3001
```

## Commands

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Create an optimized production build
npm run start     # Serve the production build
```

## Planned Frontend Areas

The frontend roadmap includes:

- Public marketplace search, categories, product details, and supplier profiles.
- Buyer workspace for RFQs, quotations, negotiations, orders, payments, documents, and reviews.
- Seller workspace for company settings, products, inventory, RFQ responses, quotations, orders, shipments, and documents.
- Admin workspace for verification, compliance, catalog moderation, disputes, and analytics.
- Authenticated messaging and realtime notifications backed by the NestJS API.

These areas are planned and should not be considered implemented until their routes, UI states, API integration, and tests are present.

## API Integration Direction

The web application will consume versioned REST endpoints from the NestJS backend, for example:

```text
/api/v1/auth
/api/v1/products
/api/v1/suppliers
/api/v1/rfqs
/api/v1/quotations
/api/v1/orders
/api/v1/payments
/api/v1/shipments
/api/v1/documents
```

WebSockets may be used for messaging and realtime notifications. The frontend should treat the backend as the authority for permissions, prices, payment status, order status, and other business rules.

## Environment Configuration

No frontend environment variables are required by the current starter page. When API integration is added, document public browser-safe configuration here and keep secrets on the server. Never commit `.env` files or credentials.

## Quality Checks

The repository CI workflow runs the frontend lint and production build on pushes and pull requests. Run both locally before opening a pull request:

```bash
npm run lint
npm run build
```

See the repository root [README](../README.md) for the complete product vision, architecture, roadmap, and contribution workflow.

## License

This project is currently marked as `UNLICENSED` in the API package configuration. Refer to the repository [LICENSE](../LICENSE) file before distributing the software.
