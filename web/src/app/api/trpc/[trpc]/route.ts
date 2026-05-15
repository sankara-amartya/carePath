import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

// ─── Next.js API route ─────────────────────────────────────────────────────
// This single route handles ALL tRPC calls from both:
//   - The mobile app (Expo) → https://your-domain.com/api/trpc/...
//   - The web dashboard     → /api/trpc/...

async function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
    onError({ error, path }) {
      console.error(`[tRPC onError] path=${path} code=${error.code} message=${error.message}`);
      if (error.cause) console.error("[tRPC onError] cause:", error.cause);
    },
    responseMeta() {
      return {
        headers: {
          // Allow mobile app to call this endpoint cross-origin
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      };
    },
  });
}

export { handler as GET, handler as POST };

// Handle CORS preflight requests from the mobile app
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
