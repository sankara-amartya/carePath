import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

  // Generate a new weekly summary using Claude
  generate: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        weekStart: z.string().transform((s) => new Date(s)),
        weekEnd: z.string().transform((s) => new Date(s)),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch the week's data for context
      const [medications, logs, healthChecks, alerts] = await Promise.all([
        ctx.db.medication.findMany({
          where: { patientId: input.patientId, active: true },
        }),
        ctx.db.medicationLog.findMany({
          where: {
            medication: { patientId: input.patientId },
            takenAt: { gte: input.weekStart, lte: input.weekEnd },
          },
          include: { medication: true },
        }),
        ctx.db.healthCheck.findMany({
          where: {
            patientId: input.patientId,
            createdAt: { gte: input.weekStart, lte: input.weekEnd },
          },
          orderBy: { createdAt: "asc" },
        }),
        ctx.db.alert.findMany({
          where: {
            patientId: input.patientId,
            createdAt: { gte: input.weekStart, lte: input.weekEnd },
          },
        }),
      ]);

      // Build context for Claude
      const medSummary = medications.map((m) => `- ${m.name} ${m.dosage} (${m.frequency})`).join("\n");

      const logsByMed: Record<string, { taken: number; missed: number; skipped: number }> = {};
      for (const log of logs) {
        const name = `${log.medication.name} ${log.medication.dosage}`;
        if (!logsByMed[name]) logsByMed[name] = { taken: 0, missed: 0, skipped: 0 };
        logsByMed[name][log.status]++;
      }
      const adherenceSummary = Object.entries(logsByMed)
        .map(([name, counts]) => {
          const total = counts.taken + counts.missed + counts.skipped;
          const rate = total > 0 ? Math.round((counts.taken / total) * 100) : 0;
          return `- ${name}: ${rate}% adherence (${counts.taken} taken, ${counts.missed} missed, ${counts.skipped} skipped)`;
        })
        .join("\n");

      const checkSummary = healthChecks.length > 0
        ? healthChecks
            .map((c) => {
              const date = c.createdAt.toLocaleDateString("en-US", { weekday: "short" });
              return `  ${date}: pain=${c.pain} mood=${c.mood} appetite=${c.appetite} mobility=${c.mobility} energy=${c.energy}${c.notes ? ` (${c.notes})` : ""}`;
            })
            .join("\n")
        : "No check-ins recorded this week.";

      const alertSummary = alerts.length > 0
        ? alerts.map((a) => `- ${a.type} (${a.severity}): ${a.message}`).join("\n")
        : "No alerts this week.";

      const weekRange = `${input.weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${input.weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      const prompt = `You are a healthcare AI assistant for CarePath, an elder care coordination app. Generate a concise weekly health summary for a caregiver based on the following data.

Week: ${weekRange}

MEDICATIONS:
${medSummary || "No medications listed."}

MEDICATION ADHERENCE:
${adherenceSummary || "No medication logs this week."}

DAILY HEALTH CHECK-INS (scale 1-5, where 5 is best):
${checkSummary}

ALERTS:
${alertSummary}

Write a summary in markdown format with these sections:
## Weekly Summary
A 2-3 sentence overview of the week.

### Medication Adherence
Key observations about medication compliance.

### Health Trends
Notable patterns in pain, mood, appetite, mobility, and energy.

### Alerts & Concerns
Any issues that need attention. If none, say so.

### Recommendations
1-2 actionable suggestions for the coming week.

Keep it warm, concise, and actionable. Use plain language a family caregiver can understand.`;

      let content: string;

      if (process.env.ANTHROPIC_API_KEY) {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });

        content = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n");
      } else {
        // Fallback when no API key is configured
        content = `## Weekly Summary\n\nSummary for ${weekRange}.\n\n*Configure ANTHROPIC_API_KEY in .env to enable AI-generated summaries.*\n\n### Medication Adherence\n${adherenceSummary || "No data available."}\n\n### Health Trends\n${healthChecks.length} check-in(s) recorded this week.\n\n### Alerts & Concerns\n${alertSummary}`;
      }

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
