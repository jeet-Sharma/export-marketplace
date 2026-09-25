# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Match the npm version used to generate package-lock.json locally so that
# npm ci reads the lockfile correctly (lockfileVersion 3, npm 11.x).
RUN npm install -g npm@11.6.2 --ignore-scripts

# Install dependencies first (layer cached unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and compile
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies so only production deps go into the final image
RUN npm ci --omit=dev --ignore-scripts

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled output and production node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
