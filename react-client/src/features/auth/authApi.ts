import { baseApi } from "@/store/baseApi";
import type { LoginRequest, LoginResponse } from "./authTypes";

/**
 * Auth endpoints injected into the shared baseApi (frontend-rules #10/#13).
 * login/logout are state-changing → mutations. The refresh token is handled
 * entirely via the HTTP-only cookie, so there's no refresh endpoint exposed
 * here yet — add one when silent re-auth on 401 is implemented.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
        credentials: 'omit',
      }),
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation } = authApi;
