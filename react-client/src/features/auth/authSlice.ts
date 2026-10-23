import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getCookie, deleteCookie } from "@/lib/cookies";
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

    return {
      accessToken: token ?? null,
      user: rawUser ? (JSON.parse(rawUser) as AuthUser) : null,
    };
  } catch {
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
      deleteCookie("access_token");
      deleteCookie("user_data");
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;

