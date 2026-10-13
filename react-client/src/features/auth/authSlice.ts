import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "./authTypes";

/**
 * Minimal global auth state (frontend-rules #24): the access token and the
 * authenticated user, nothing more. The access token is kept in memory only
 * — never localStorage — so it isn't exposed to XSS persistence; the refresh
 * token lives in an HTTP-only cookie the browser handles on its own.
 */
export type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; user: AuthUser }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.user = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;
