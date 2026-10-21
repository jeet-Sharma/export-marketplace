import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { getCookie, clearAuthCookies } from "@/lib/cookies";
import { isTokenExpired } from "@/lib/jwt";
import { selectAccessToken } from "@/features/auth/authSelectors";
import { clearCredentials } from "@/features/auth/authSlice";
import type { RootState } from "./store";

const rawURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_INTERNAL_URL ??
  "https://export-marketplace.onrender.com";

export const API_BASE_URL = rawURL.replace(/\/api\/v1\/?$/, "") + "/api/v1";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState, endpoint }) => {
    if (endpoint === "login") {
      headers.delete("authorization");
      return headers;
    }

    let token = selectAccessToken(getState() as RootState);
    if (!token && typeof window !== "undefined") {
      token = getCookie("access_token");
    }
    if (token && !isTokenExpired(token)) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const isLoginEndpoint =
    typeof args === "object" && "url" in args && args.url.includes("login");

  // Pre-flight check: If access token has expired, purge cookies immediately
  // and abort before sending an invalid request to the backend.
  if (!isLoginEndpoint) {
    let token = selectAccessToken(api.getState() as RootState);
    if (!token && typeof window !== "undefined") {
      token = getCookie("access_token");
    }

    if (token && isTokenExpired(token)) {
      api.dispatch(clearCredentials());
      clearAuthCookies();
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
        window.location.href = "/login?reason=expired";
      }
      return {
        error: {
          status: 401,
          data: { message: "Access token has expired." },
        },
      };
    }
  }

  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // If an authenticated request is rejected with 401 (e.g. invalid/expired token),
    // purge the stale token and cookies so the user is not stuck.
    if (!isLoginEndpoint) {
      api.dispatch(clearCredentials());
      clearAuthCookies();
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
        window.location.href = "/login?reason=unauthorized";
      }
    }
  }

  return result;
};

/**
 * Single shared RTK Query API. Handles automatic cache invalidation,
 * credentials flow, and 401 re-authentication.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Product", "ProductList", "Category", "Country", "Vendor"],
  endpoints: () => ({}),
});
