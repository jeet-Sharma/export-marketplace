/**
 * JWT utilities compatible with Browser, Node.js, and Next.js Edge Runtime.
 */

/**
 * Safely parse a JWT payload without external libraries.
 */
export function parseJwtPayload<T = Record<string, unknown>>(
  token: string | null | undefined,
): T | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    let jsonPayload: string;
    if (typeof atob === "function") {
      jsonPayload = atob(padded);
    } else if (typeof Buffer !== "undefined") {
      jsonPayload = Buffer.from(padded, "base64").toString("utf-8");
    } else {
      return null;
    }
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is null, malformed, or past its expiration time (`exp`).
 * Includes a 5-second safety buffer so near-expiry tokens aren't sent mid-flight.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const payload = parseJwtPayload<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() >= (payload.exp - 5) * 1000;
}

/**
 * Extract expiration Date object from the JWT `exp` timestamp.
 */
export function getTokenExpiryDate(
  token: string | null | undefined,
): Date | null {
  if (!token) return null;
  const payload = parseJwtPayload<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== "number") return null;
  return new Date(payload.exp * 1000);
}

/**
 * Returns remaining milliseconds until the token expires, taking into account
 * the 5-second buffer. Returns 0 if already expired or invalid.
 */
export function getTokenRemainingMs(
  token: string | null | undefined,
): number {
  if (!token) return 0;
  const payload = parseJwtPayload<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== "number") return 0;
  const remaining = (payload.exp - 5) * 1000 - Date.now();
  return Math.max(0, remaining);
}
