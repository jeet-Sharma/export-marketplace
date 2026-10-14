# Export Marketplace Web Application

The Next.js frontend for Export Marketplace.

The current application is the initial frontend foundation (App Router starter screen). Buyer/seller/admin marketplace workflows are not yet built out — the NestJS API already implements auth, products, categories, countries, and vendors (see [`nest-server/README.md`](../nest-server/README.md)), but this app does not yet consume them.

## Technology

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- React Compiler enabled in `next.config.ts`
- `output: "standalone"` for a minimal production Docker image

## Getting started with Docker (recommended)

Run this from the **repository root**, not from `react-client/`:

```bash
cp .env.docker.example .env
docker compose -f docker-compose.dev.yml up --build
```

This starts the web app together with the API, PostgreSQL, and LocalStack, fully networked. The web app will be at http://localhost:3000. See the [root README](../README.md) for the full Docker workflow and environment variables.

## Getting started without Docker

```bash
cd react-client
npm ci
npm run dev
```

Open http://localhost:3000. If the API is also running without Docker, make sure `NEXT_PUBLIC_API_URL` in `react-client/.env` points at it (default `http://localhost:3005`).

If you need to run on a different port because something else is using 3000:

```bash
npm run dev -- --port 3001
```

### Environment variables

Set these in `react-client/.env` (already present with local-dev defaults):

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL the browser uses to call the NestJS API. `NEXT_PUBLIC_*` vars are inlined into the bundle at **build time** — changing this requires a rebuild (`npm run build` / rebuilding the Docker image), not just a restart. |
| `PORT` | Dev/prod server port. Defaults to `3000`. |

Only put values here that are safe to expose in the browser — never secrets.

## Commands

```bash
npm run dev     # Start the development server (hot reload)
npm run lint    # Run ESLint
npm run build   # Create an optimized production build
npm run start   # Serve the production build (run `build` first)
```

## Project structure

```text
react-client/
├── public/             # Static assets
├── src/app/
│   ├── layout.tsx      # Root layout and metadata
│   ├── page.tsx        # Current home page
│   └── globals.css     # Global styles
├── Dockerfile           # Production build (standalone output)
├── Dockerfile.dev        # Development build (hot reload, bind-mounted source)
├── eslint.config.mjs
├── next.config.ts
├── package.json
└── package-lock.json
```

## CI

The repository workflow (`.github/workflows/ci.yml`) runs lint and production build on every push/PR:

```bash
npm run lint
npm run build
```

See the [repository root README](../README.md) for the complete product vision, architecture, and Docker setup shared with the API.

## License

Marked `UNLICENSED` in the API package configuration. See [LICENSE](../LICENSE).
