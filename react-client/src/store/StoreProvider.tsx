"use client";

import { Provider } from "react-redux";
import { store } from "./store";

/**
 * Narrow client boundary for Redux (frontend-rules #34). Only this Provider is
 * a client component — server-component children passed in still render on the
 * server. The store is a module-level singleton, so there's a single instance
 * for the browser's lifetime without needing a ref.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
