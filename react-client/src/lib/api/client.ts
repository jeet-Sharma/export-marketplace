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
 */
const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  // Fails loudly at build/runtime rather than silently calling a relative
  // path that would 404 against this Next.js app itself instead of the API.
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set. Add it to react-client/.env.",
  );
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
  },
});
