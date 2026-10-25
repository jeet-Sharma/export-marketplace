/**
 * Base URL for Nest API calls, including the global `/api/v1` prefix.
 *
 * Browser code must use a host the user's machine can reach
 * (`NEXT_PUBLIC_API_URL`, for example `http://localhost:3005`).
 * Server-rendered pages inside Docker cannot use that host: `localhost`
 * is the web container itself. `API_INTERNAL_URL` (`http://api:3005`) is
 * therefore preferred only when this module is evaluated on the server.
 */
export function resolveApiBaseUrl(): string {
  const serverUrl =
    typeof window === "undefined" ? process.env.API_INTERNAL_URL : undefined;
  const raw =
    serverUrl ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://export-marketplace.onrender.com";

  return raw.replace(/\/api\/v1\/?$/, "") + "/api/v1";
}
