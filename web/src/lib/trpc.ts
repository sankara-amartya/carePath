"use client";

/**
 * Web tRPC client setup.
 *
 * We use the `@trpc/react-query` adapter which gives us React Query hooks
 * (useQuery, useMutation) but backed by tRPC for full type-safety.
 *
 * The client sends requests to /api/trpc/* — the Next.js route handler
 * in src/app/api/trpc/[trpc]/route.ts receives them and calls Prisma.
 *
 * Auth: We attach the Clerk session token as a Bearer token on every request.
 * The server extracts and verifies it in createContext().
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

export const trpc = createTRPCReact<AppRouter>();
