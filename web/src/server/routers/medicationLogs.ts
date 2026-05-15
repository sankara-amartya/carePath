import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const medicationLogsRouter = router({
  // Log a dose (taken / skipped)
  log: protectedProcedure
    .input(
      z.object({
        medicationId: z.string(),
        status: z.enum(["taken", "skipped", "missed"]),
        photoUrl: z.string().optional(),
        aiVerified: z.boolean().optional(),
        aiConfidence: z.number().min(0).max(1).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { clerkId: ctx.userId },
      });
      return ctx.db.medicationLog.create({
        data: {
          ...input,
          loggedById: user.id,
        },
      });
    }),

  // Get today's logs for all medications of a patient
  today: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      return ctx.db.medicationLog.findMany({
        where: {
          medication: { patientId: input.patientId },
          loggedAt: { gte: startOfDay },
        },
        include: { medication: true },
        orderBy: { loggedAt: "desc" },
      });
    }),

  // Get log history for a specific medication (for heatmap)
  history: protectedProcedure
    .input(
      z.object({
        medicationId: z.string(),
        days: z.number().int().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      return ctx.db.medicationLog.findMany({
        where: {
          medicationId: input.medicationId,
          loggedAt: { gte: since },
        },
        orderBy: { loggedAt: "asc" },
      });
    }),
});
