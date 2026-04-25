import { router } from "../trpc";
import { patientsRouter } from "./patients";
import { medicationsRouter } from "./medications";
import { medicationLogsRouter } from "./medicationLogs";
import { healthChecksRouter } from "./healthChecks";
import { careTeamRouter } from "./careTeam";
import { alertsRouter } from "./alerts";
import { aiSummariesRouter } from "./aiSummaries";

// ─── Root router ────────────────────────────────────────────────────────────
// This combines all sub-routers into one. The mobile app and web dashboard
// call these as: trpc.medications.list, trpc.healthChecks.create, etc.
export const appRouter = router({
  patients: patientsRouter,
  medications: medicationsRouter,
  medicationLogs: medicationLogsRouter,
  healthChecks: healthChecksRouter,
  careTeam: careTeamRouter,
  alerts: alertsRouter,
  aiSummaries: aiSummariesRouter,
});

// Export the type — the mobile app imports this for type-safe API calls
export type AppRouter = typeof appRouter;
