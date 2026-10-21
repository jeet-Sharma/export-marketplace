import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getCookie, clearAuthCookies } from "@/lib/cookies";
import { isTokenExpired } from "@/lib/jwt";
import type { AuthUser } from "./authTypes";

/**
 * Global auth state hydrated from cookies on page load (F5),
 * kept in sync with Redux memory.
 */
export type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
};

// Read cookies on initial browser load so refresh (F5) doesn't log the user out
function getInitialAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { accessToken: null, user: null };
  }

  try {
    const token = getCookie("access_token");
    const rawUser = getCookie("user_data");

    if (!token || isTokenExpired(token)) {
      clearAuthCookies();
      return { accessToken: null, user: null };
    }

    return {
      accessToken: token,
      user: rawUser ? (JSON.parse(rawUser) as AuthUser) : null,
    };
  } catch {
    clearAuthCookies();
    return { accessToken: null, user: null };
  }
}

const initialState: AuthState = getInitialAuthState();

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

      // Clean up cookies on logout
      clearAuthCookies();
    },
    hydrateFromCookies(state) {
      if (typeof window === "undefined") {
        return;
      }
      try {
        const token = getCookie("access_token");
        const rawUser = getCookie("user_data");
        if (token && !isTokenExpired(token)) {
          state.accessToken = token;
          state.user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
        } else {
          state.accessToken = null;
          state.user = null;
          clearAuthCookies();
        }
      } catch {
        state.accessToken = null;
        state.user = null;
        clearAuthCookies();
      }
    },
  },
});

export const { setCredentials, clearCredentials, hydrateFromCookies } =
  authSlice.actions;
export const authReducer = authSlice.reducer;

