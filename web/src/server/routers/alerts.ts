import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const alertsRouter = router({
  // List active alerts for a patient
  list: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        resolved: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.alert.findMany({
        where: {
          patientId: input.patientId,
          resolved: input.resolved,
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Resolve an alert
  resolve: protectedProcedure
    .input(z.object({ alertId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { clerkId: ctx.userId },
      });
      return ctx.db.alert.update({
        where: { id: input.alertId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedById: user.id,
        },
      });
    }),
});
