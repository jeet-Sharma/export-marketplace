"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAccessToken } from "../authSelectors";
import { clearCredentials } from "../authSlice";
import { clearAuthCookies, getCookie } from "@/lib/cookies";
import { isTokenExpired, getTokenRemainingMs } from "@/lib/jwt";

/**
 * Background watcher that monitors JWT expiration.
 * Whenever the token expires (either in real-time, via page visibility, or interval),
 * it immediately purges the cookies, clears Redux state, and routes to /login.
 */
export function AuthExpiryWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const reduxToken = useAppSelector(selectAccessToken);

  // Keep latest pathname in ref for timeout callbacks
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // Check both Redux state and cookies for token
    const token = reduxToken || getCookie("access_token");

    if (!token) {
      return;
    }

    const purgeSession = () => {
      clearAuthCookies();
      dispatch(clearCredentials());
      if (pathnameRef.current?.startsWith("/dashboard")) {
        router.push("/login?reason=expired");
      }
    };

    // 1. Immediate check: if token is already expired, purge instantly
    if (isTokenExpired(token)) {
      purgeSession();
      return;
    }

    // 2. Schedule precise timer for the exact millisecond of token expiration
    const remainingMs = getTokenRemainingMs(token);
    const timeoutId = setTimeout(() => {
      purgeSession();
    }, remainingMs);

    // 3. Fallback interval check every 10 seconds (handles computer sleep/wake)
    const intervalId = setInterval(() => {
      const currentToken = getCookie("access_token") || reduxToken;
      if (currentToken && isTokenExpired(currentToken)) {
        purgeSession();
      }
    }, 10_000);

    // 4. Handle tab visibility change (e.g. user resumes tab after being away)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const currentToken = getCookie("access_token") || reduxToken;
        if (currentToken && isTokenExpired(currentToken)) {
          purgeSession();
        }
      }
    };

    const onFocus = () => {
      const currentToken = getCookie("access_token") || reduxToken;
      if (currentToken && isTokenExpired(currentToken)) {
        purgeSession();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [reduxToken, dispatch, router]);

  return null;
}
