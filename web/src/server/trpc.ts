import { initTRPC, TRPCError } from "@trpc/server";
import { createClerkClient } from "@clerk/backend";
import { db } from "./db";

// ─── Clerk backend client ────────────────────────────────────────────────────
// Used to verify JWT tokens sent from the mobile app and web client
export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
});

// ─── Context ────────────────────────────────────────────────────────────────
// Every tRPC request gets this context object
export type Context = {
  db: typeof db;
  userId: string | null; // Verified Clerk user ID
};

export async function createContext(opts: {
  req: Request;
}): Promise<Context> {
  let userId: string | null = null;

  try {
    const requestState = await clerk.authenticateRequest(opts.req);

    if (requestState.isSignedIn) {
      userId = requestState.toAuth().userId;
    }
  } catch (err) {
    console.error("Clerk Auth Error:", err);
  }

  return { db, userId };
}

import superjson from "superjson";

// ─── tRPC init ──────────────────────────────────────────────────────────────
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

// ─── Reusable pieces ────────────────────────────────────────────────────────
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: require authentication
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to do this.",
    });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

// Protected procedure — requires a verified Clerk session
export const protectedProcedure = t.procedure.use(enforceAuth);
