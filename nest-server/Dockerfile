# syntax=docker/dockerfile:1

# ─── Stage 1: dependencies ────────────────────────────────────────────────────
# Install ALL dependencies (including dev) needed to build the project.
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ─── Stage 2: build ───────────────────────────────────────────────────────────
# Compile TypeScript -> dist using the full dependency set.
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Strip dev dependencies so only production deps are copied into the runtime image.
RUN npm prune --omit=dev

# ─── Stage 3: runtime ─────────────────────────────────────────────────────────
# Minimal image containing only the compiled output and production deps.
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
# Default internal port; override via compose/.env if needed.
ENV PORT=3005

# Run as the built-in non-root "node" user for security.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3005

# On container start, apply any pending DB migrations, then launch the app.
# - Migrations run via the TypeORM CLI against the COMPILED data-source
#   (dist/database/data-source.js) using plain `node` — the dev-only `tsx`
#   runner is pruned from this image, so the TS-based migration:run script
#   cannot be used here; migration:run:prod exists for exactly this.
# - `typeorm` is a production dependency, so its CLI is present after prune.
# - The project is ESM ("type": "module"), so the entrypoint must reference
#   dist/main.js with its explicit .js extension.
# Using shell form so both commands run in sequence; migrations must succeed
# before the API accepts traffic.
CMD ["sh", "-c", "npm run migration:run:prod && node dist/main.js"]
