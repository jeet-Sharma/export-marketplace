import type { RootState } from "@/store/store";

export const selectAccessToken = (state: RootState) => state.auth.accessToken;

export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectIsAuthenticated = (state: RootState) =>
  state.auth.accessToken !== null;

export const selectPermissions = (state: RootState) =>
  state.auth.user?.permissions ?? [];
