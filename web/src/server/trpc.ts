import { initTRPC, TRPCError } from "@trpc/server";
import { createClerkClient } from "@clerk/backend";
import { db } from "./db";

// ─── Clerk backend client ────────────────────────────────────────────────────
// Used to verify JWT tokens sent from the mobile app and web client
export const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
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
    // Debug: Log the incoming request URL
    console.log(`[tRPC Context] Authenticating request to: ${opts.req.url}`);

    // Pass headers and URL explicitly to avoid any potential URL parsing issues
    const requestState = await clerk.authenticateRequest({
      request: opts.req,
    });
    
    console.log(`[tRPC Context] Auth status: ${requestState.status}`);

    if (requestState.isSignedIn) {
      userId = requestState.toAuth().userId;
      console.log(`[tRPC Context] User authenticated: ${userId}`);
    } else {
      console.log(`[tRPC Context] User not signed in. Reason: ${requestState.reason || 'Unknown'}`);
    }
  } catch (err) {
    console.error("Clerk Auth Error:", err);
    // Log the error stack to see exactly where it fails
    if (err instanceof Error) {
      console.error(err.stack);
    }
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
