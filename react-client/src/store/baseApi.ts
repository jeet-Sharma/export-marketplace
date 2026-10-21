import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectAccessToken } from "@/features/auth/authSelectors";
import type { RootState } from "./store";

/**
 * Resolve the API base URL for RTK Query's fetchBaseQuery.
 *
 * On the server (SSR / generateMetadata), prefer the Docker-internal URL
 * (http://api:3005) so server-to-server fetches don't bounce through the
 * host's published port. Falls back to the public NEXT_PUBLIC_API_URL for
 * local non-Docker dev where API_INTERNAL_URL is not set.
 *
 * In the browser, always use the public host-reachable URL.
 *
 * The /api/v1 prefix is appended (idempotently) so the var can be set with
 * or without it — see client.ts for the same normalisation rationale.
 */
const isServer = typeof window === "undefined";

const rawURL = isServer
  ? (process.env.API_INTERNAL_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "http://localhost:3005")
  : (process.env.NEXT_PUBLIC_API_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "http://localhost:3005");

const API_BASE_URL = rawURL.replace(/\/api\/v1\/?$/, "") + "/api/v1";

/**
 * Single shared RTK Query API (frontend-rules #11). Every feature API is
 * created with baseApi.injectEndpoints so there's one cache, one middleware,
 * and one base-URL config. credentials:"include" lets the HTTP-only refresh
 * cookie flow on cross-origin requests; the Bearer header carries the
 * in-memory access token from auth state.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = selectAccessToken(getState() as RootState);
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Product", "ProductList", "Category", "Country", "Vendor"],
  endpoints: () => ({}),
});
