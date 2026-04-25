import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const aiSummariesRouter = router({
  // Get the latest AI summary for a patient
  latest: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.aiSummary.findFirst({
        where: { patientId: input.patientId },
        orderBy: { generatedAt: "desc" },
      });
    }),

  // Generate a new weekly summary
  // In production, this would call Claude API and stream the response
  generate: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        weekStart: z.string().transform((s) => new Date(s)),
        weekEnd: z.string().transform((s) => new Date(s)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Call Claude API to generate the summary
      // For now, create a placeholder
      const content = `## Weekly Summary\n\nSummary for the week of ${input.weekStart.toLocaleDateString()} to ${input.weekEnd.toLocaleDateString()}.\n\n*AI summary generation will be connected in a future update.*`;

      return ctx.db.aiSummary.create({
        data: {
          patientId: input.patientId,
          weekStart: input.weekStart,
          weekEnd: input.weekEnd,
          content,
        },
      });
    }),
});
