import { z } from "zod";
import { router, protectedProcedure, clerk } from "../trpc";

export const patientsRouter = router({
  // Get a single patient by ID
  get: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.patient.findUniqueOrThrow({
        where: { id: input.patientId },
        include: {
          medications: { where: { active: true }, orderBy: { createdAt: "desc" } },
          careTeam: { include: { user: true } },
        },
      });
    }),

  // List all patients the current user has access to
  listForUser: protectedProcedure.query(async ({ ctx }) => {
    // A user has access if they are a CareTeamMember for that patient
    const memberships = await ctx.db.careTeamMember.findMany({
      where: { user: { clerkId: ctx.userId } },
      include: { patient: true },
    });
    return memberships.map((m) => m.patient);
  }),

  // Create a new patient (onboarding)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        dateOfBirth: z.string().transform((s) => new Date(s)),
        conditions: z.array(z.string()).default([]),
        emergencyContact: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Create the patient
      const patient = await ctx.db.patient.create({ data: input });

      // 2. Fetch the Clerk user to get their name/email
      const clerkUser = await clerk.users.getUser(ctx.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || "";
      const name = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim() : email.split("@")[0];

      // 3. Ensure the User exists in our DB
      let dbUser = await ctx.db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      if (!dbUser) {
        dbUser = await ctx.db.user.create({
          data: {
            clerkId: ctx.userId,
            email,
            name,
          },
        });
      }

      // 4. Create the CareTeamMember link as PRIMARY_CAREGIVER
      await ctx.db.careTeamMember.create({
        data: {
          patientId: patient.id,
          userId: dbUser.id,
          role: "PRIMARY_CAREGIVER",
        },
      });

      // 5. Update Clerk publicMetadata so the frontend knows their role immediately
      await clerk.users.updateUserMetadata(ctx.userId, {
        publicMetadata: {
          role: "PRIMARY_CAREGIVER",
        },
      });

      return patient;
    }),

  // Update patient info
  update: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        name: z.string().min(1).optional(),
        conditions: z.array(z.string()).optional(),
        emergencyContact: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { patientId, ...data } = input;
      return ctx.db.patient.update({ where: { id: patientId }, data });
    }),
});
