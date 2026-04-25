import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const careTeamRouter = router({
  // List all care team members for a patient
  list: protectedProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.careTeamMember.findMany({
        where: { patientId: input.patientId },
        include: { user: true },
        orderBy: { joinedAt: "desc" },
      });
    }),

  // Invite a user to the care team
  invite: protectedProcedure
    .input(
      z.object({
        patientId: z.string(),
        email: z.string().email(),
        role: z.enum([
          "PRIMARY_CAREGIVER",
          "SECONDARY_CAREGIVER",
          "DOCTOR",
          "PATIENT",
          "AGENCY_ADMIN",
          "PLATFORM_ADMIN",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find or create user by email
      let user = await ctx.db.user.findUnique({ where: { email: input.email } });

      if (!user) {
        // Create a placeholder user — they'll be linked to Clerk on first login
        user = await ctx.db.user.create({
          data: {
            email: input.email,
            name: input.email.split("@")[0],
            clerkId: `pending_${Date.now()}`, // temporary until Clerk sync
          },
        });
      }

      return ctx.db.careTeamMember.create({
        data: {
          patientId: input.patientId,
          userId: user.id,
          role: input.role,
        },
        include: { user: true },
      });
    }),

  // Change a member's role
  changeRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum([
          "PRIMARY_CAREGIVER",
          "SECONDARY_CAREGIVER",
          "DOCTOR",
          "PATIENT",
          "AGENCY_ADMIN",
          "PLATFORM_ADMIN",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.careTeamMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });
    }),

  // Remove from care team
  remove: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.careTeamMember.delete({
        where: { id: input.memberId },
      });
    }),
});
