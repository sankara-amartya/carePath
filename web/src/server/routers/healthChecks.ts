import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const healthChecksRouter = router({
  // Submit a daily check-in
  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        pain: z.number().int().min(1).max(5),
        mood: z.number().int().min(1).max(5),
        appetite: z.number().int().min(1).max(5),
        mobility: z.number().int().min(1).max(5),
        energy: z.number().int().min(1).max(5),
        notes: z.string().optional(),
        voiceUrl: z.string().optional(),
        transcript: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { clerkId: ctx.userId },
      });
      return ctx.db.healthCheck.create({
        data: {
          ...input,
          recordedById: user.id,
        },
      });
    }),

  // Get the most recent check-in for a patient
  latest: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.healthCheck.findFirst({
        where: { patientId: input.patientId },
        orderBy: { checkedAt: "desc" },
      });
    }),

  // List check-in history
  list: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        days: z.number().int().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      return ctx.db.healthCheck.findMany({
        where: {
          patientId: input.patientId,
          checkedAt: { gte: since },
        },
        orderBy: { checkedAt: "desc" },
      });
    }),
});
