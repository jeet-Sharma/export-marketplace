import { isTokenExpired } from "./jwt";

/**
 * Browser cookie utilities for managing client-side cookies.
 */

// =========================================================================
// [HELPER 1]: Set a cookie with path, security attributes, and expiry
// =========================================================================
export function setCookie(
  name: string,
  value: string,
  expiresOrDays: Date | number = 7,
): void {
  if (typeof document === "undefined") return;

  let expiresDate: Date;
  if (expiresOrDays instanceof Date) {
    expiresDate = expiresOrDays;
  } else {
    expiresDate = new Date();
    expiresDate.setTime(
      expiresDate.getTime() + expiresOrDays * 24 * 60 * 60 * 1000,
    );
  }

  // Use Secure flag when deployed in production (HTTPS)
  const isSecure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  // SameSite=Lax provides CSRF protection
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Lax${isSecure}`;
}

// =========================================================================
// [HELPER 2]: Read a cookie by name, auto-purging expired tokens
// =========================================================================
function getRawCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  // If reading user_data, check that access_token is also present and valid
  if (name === "user_data") {
    const token = getRawCookie("access_token");
    if (!token || isTokenExpired(token)) {
      clearAuthCookies();
      return null;
    }
  }

  const val = getRawCookie(name);
  if (!val) return null;

  // If the access_token has expired, automatically purge auth cookies
  if (name === "access_token" && isTokenExpired(val)) {
    clearAuthCookies();
    return null;
  }

  return val;
}

// =========================================================================
// [HELPER 3]: Delete a cookie by expiring it immediately
// =========================================================================
export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  // Purge with path=/ and SameSite=Lax
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax;`;
  // Secondary purge without SameSite in case of browser-specific storage matching
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// =========================================================================
// [HELPER 4]: Purge all auth-related cookies in one call
// =========================================================================
export function clearAuthCookies(): void {
  deleteCookie("access_token");
  deleteCookie("user_data");
}

// =========================================================================
// [HELPER 5]: Check if there is an active (non-expired) session
// =========================================================================
export function isSessionActive(): boolean {
  const token = getCookie("access_token");
  return Boolean(token && !isTokenExpired(token));
}
