import { createTRPCReact } from "@trpc/react-query";

// ─── Type import ────────────────────────────────────────────────────────────
// We import the AppRouter type from the web project.
// This gives us full type-safety on every API call.
//
// HOW IT WORKS:
// The "type" keyword means this import is erased at runtime — it's only used
// by TypeScript for autocompletion and error checking. No actual web code
// is bundled into the mobile app.
//
// If the import path doesn't resolve (red squiggly), add this to tsconfig.json:
//   "compilerOptions": { "paths": { "@web/*": ["../web/src/*"] } }
import type { AppRouter } from "../../web/src/server/routers/_app";

// ─── tRPC React hooks ───────────────────────────────────────────────────────
// Usage in any screen:
//   import { trpc } from '../trpc/client';
//   const { data } = trpc.medications.list.useQuery({ patientId: '...' });
export const trpc = createTRPCReact<AppRouter>();
