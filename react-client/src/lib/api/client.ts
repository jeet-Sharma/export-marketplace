import axios from "axios";

/**
 * Shared axios instance for every API call in the app. Centralizes the
 * base URL so it's never repeated per call-site — see frontend-rules.md
 * section 11 ("API base query" / "do not repeat API base URLs").
 *
 * NEXT_PUBLIC_API_URL is the exact env var name used across the repo
 * (Docker Compose files, the client Dockerfile build arg, .env.docker.example)
 * — see routes.ts's own comment on this; do not introduce a differently
 * named variable.
 *
 * The NestJS server sets a global `/api/v1` prefix (nest-server/src/main.ts,
 * Phase-1-API-Specification-v0.1 section 2). We append it here centrally so
 * every call-site can use bare resource paths (e.g. "/products") regardless
 * of whether the env var was set with or without the prefix — Docker Compose
 * defaults omit it (http://localhost:3005) while the local .env may include
 * it. Stripping first makes this idempotent in both cases.
 *
 * ## Server vs browser base URL
 *
 * Inside Docker Compose, NEXT_PUBLIC_API_URL is host-reachable
 * (e.g. http://localhost:3005) so the browser can call it directly. But when
 * Next.js Server Components or generateMetadata run inside the `web`
 * container, "localhost" resolves to the container itself — not to the `api`
 * service — causing every SSR fetch to 404.
 *
 * API_INTERNAL_URL is a server-only (non-NEXT_PUBLIC_) variable set to the
 * Docker service DNS name (http://api:3005) in both Compose stacks. It is
 * only read on the server (typeof window === "undefined") so it is never
 * sent to the browser. When it is absent (local dev outside Docker, CI, etc.)
 * we fall back to NEXT_PUBLIC_API_URL which is always defined.
 */
const isServer = typeof window === "undefined";

const rawURL = isServer
  ? // Prefer the internal Docker network URL on the server so SSR fetches
    // reach the `api` container directly. Falls back to the public URL for
    // local (non-Docker) development where API_INTERNAL_URL is not set.
    (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL)
  : // In the browser, always use the public host-reachable URL.
    process.env.NEXT_PUBLIC_API_URL;

if (!rawURL) {
  // Fails loudly at build/runtime rather than silently calling a relative
  // path that would 404 against this Next.js app itself instead of the API.
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Add it to react-client/.env.",
  );
}

// Normalise: remove a trailing /api/v1 if the env var already includes it,
// then always append /api/v1 so Docker defaults and local .env both resolve
// correctly.
const baseURL = rawURL.replace(/\/api\/v1\/?$/, "") + "/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});
