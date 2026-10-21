import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth/authSlice";
import { baseApi } from "./baseApi";
import "@/features/auth/authApi";
import "@/features/dashboard/products/productsApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
