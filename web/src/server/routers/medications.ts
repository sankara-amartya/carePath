import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const medicationsRouter = router({
  // List all medications for a patient
  list: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.medication.findMany({
        where: { patientId: input.patientId, active: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create a new medication
  create: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        name: z.string().min(1),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        scheduleTimes: z.array(z.string()).default([]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.medication.create({ data: input });
    }),

  // Update a medication
  update: protectedProcedure
    .input(
      z.object({
        medicationId: z.string(),
        name: z.string().optional(),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
        scheduleTimes: z.array(z.string()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { medicationId, ...data } = input;
      return ctx.db.medication.update({ where: { id: medicationId }, data });
    }),

  // Soft-delete (deactivate) a medication
  delete: protectedProcedure
    .input(z.object({ medicationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.medication.update({
        where: { id: input.medicationId },
        data: { active: false },
      });
    }),
});
