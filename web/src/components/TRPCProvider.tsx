"use client";

/**
 * TRPCProvider — wraps the app with React Query + tRPC infrastructure.
 *
 * Place this in the root layout so ALL pages can call trpc.* hooks.
 *
 * What this does:
 *  1. Creates a tRPC HTTP client pointing at /api/trpc
 *  2. Attaches the Clerk session token as "Authorization: Bearer <token>"
 *     so the server-side createContext() can verify the user
 *  3. Wraps children in QueryClientProvider (React Query) + trpc.Provider
 */

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useAuth } from "@clerk/nextjs";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser: use relative URL
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30 seconds
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          async headers() {
            const token = await getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
