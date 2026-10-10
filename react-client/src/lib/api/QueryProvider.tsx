"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Narrow client boundary for TanStack Query. The QueryClient is created
 * once per browser session via useState (not module scope), so a fresh
 * client isn't accidentally shared across requests on the server and
 * isn't recreated on every render on the client — the standard Next.js
 * App Router pattern for client-side providers.
 *
 * Mounted high in the root layout, but this file alone is the client
 * boundary — see frontend-rules.md section 34, "do not convert the entire
 * Next.js root application into a Client Component simply to support"
 * a provider.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Catalogue data doesn't change every second; avoid refetching
            // on every window focus for a marketplace homepage.
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
