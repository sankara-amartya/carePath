import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useAuth } from "@clerk/expo";
import { trpc } from "./client";

// ─── API URL ────────────────────────────────────────────────────────────────
// In development, use your local Next.js dev server.
// In production, this will be your Vercel deployment URL.
//
// For Expo Go on a real device, use your computer's local IP (e.g., 192.168.1.5)
// For Android emulator, use 10.0.2.2 instead of localhost
const API_URL = __DEV__
  ? "http://localhost:3000/api/trpc"       // ← change to your IP for real device
  : "https://your-app.vercel.app/api/trpc"; // ← change when you deploy

// ─── Provider ───────────────────────────────────────────────────────────────
// Wrap your app with this to enable tRPC hooks everywhere.
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch on window focus (mobile doesn't have this)
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
            // Keep data fresh for 30 seconds
            staleTime: 30 * 1000,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: API_URL,
          headers: async () => {
            const token = await getToken();
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
