import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectAccessToken } from "@/features/auth/authSelectors";
import type { RootState } from "./store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3005/api/v1";

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
  tagTypes: ["Product", "ProductList"],
  endpoints: () => ({}),
});
