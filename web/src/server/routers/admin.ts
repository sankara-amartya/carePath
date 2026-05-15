import { z } from "zod";
import { router, protectedProcedure, clerk } from "../trpc";
import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import type { Context } from "../trpc";

// ─── Platform Admin middleware ──────────────────────────────────────────────
// Checks that the logged-in user has PLATFORM_ADMIN role in Clerk metadata
const t = initTRPC.context<Context>().create();

const enforcePlatformAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in." });
  }

  const clerkUser = await clerk.users.getUser(ctx.userId);
  const role = clerkUser.publicMetadata?.role;

  if (role !== "PLATFORM_ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Platform Admin access required.",
    });
  }

  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

const adminProcedure = protectedProcedure.use(enforcePlatformAdmin);

// ─── Admin Router ───────────────────────────────────────────────────────────
export const adminRouter = router({
  // ── Overview stats ──────────────────────────────────────────────────────
  stats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      activeMedications,
      unresolvedAlerts,
      todayMedLogs,
      missedLast24h,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.patient.count(),
      ctx.db.careTeamMember.count({ where: { role: "DOCTOR" } }),
      ctx.db.medication.count({ where: { active: true } }),
      ctx.db.alert.count({ where: { resolved: false } }),
      ctx.db.medicationLog.count({
        where: {
          loggedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      ctx.db.medicationLog.count({
        where: {
          status: "missed",
          loggedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Count caregivers (PRIMARY + SECONDARY)
    const totalCaregivers = await ctx.db.careTeamMember.count({
      where: { role: { in: ["PRIMARY_CAREGIVER", "SECONDARY_CAREGIVER"] } },
    });

    // Role distribution
    const roleDistribution = await ctx.db.careTeamMember.groupBy({
      by: ["role"],
      _count: true,
    });

    return {
      totalUsers,
      totalPatients,
      totalCaregivers,
      totalDoctors,
      activeMedications,
      unresolvedAlerts,
      todayMedLogs,
      missedLast24h,
      roleDistribution: roleDistribution.map((r) => ({
        role: r.role,
        count: r._count,
      })),
    };
  }),

  // ── All users ───────────────────────────────────────────────────────────
  listUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          include: {
            careTeamMembers: {
              include: { patient: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.user.count({ where }),
      ]);

      // Filter by role after join if specified
      const filtered = input.role
        ? users.filter((u) =>
            u.careTeamMembers.some((m) => m.role === input.role)
          )
        : users;

      return {
        users: filtered.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          clerkId: u.clerkId,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt,
          isPending: u.clerkId.startsWith("pending_"),
          roles: u.careTeamMembers.map((m) => ({
            role: m.role,
            patientId: m.patientId,
            patientName: m.patient.name,
          })),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // ── All patients ────────────────────────────────────────────────────────
  listPatients: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }

      const [patients, total] = await Promise.all([
        ctx.db.patient.findMany({
          where,
          include: {
            careTeam: { include: { user: true } },
            medications: { where: { active: true } },
            alerts: { where: { resolved: false } },
            healthChecks: { orderBy: { checkedAt: "desc" }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.patient.count({ where }),
      ]);

      return {
        patients: patients.map((p) => {
          const primary = p.careTeam.find(
            (m) => m.role === "PRIMARY_CAREGIVER"
          );
          return {
            id: p.id,
            name: p.name,
            dateOfBirth: p.dateOfBirth,
            conditions: p.conditions,
            emergencyContact: p.emergencyContact,
            createdAt: p.createdAt,
            primaryCaregiver: primary
              ? { name: primary.user.name, email: primary.user.email }
              : null,
            teamSize: p.careTeam.length,
            activeMedications: p.medications.length,
            unresolvedAlerts: p.alerts.length,
            lastCheckIn: p.healthChecks[0]?.checkedAt ?? null,
            careTeam: p.careTeam.map((m) => ({
              id: m.id,
              role: m.role,
              userName: m.user.name,
              userEmail: m.user.email,
              joinedAt: m.joinedAt,
            })),
          };
        }),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // ── Patient detail ──────────────────────────────────────────────────────
  getPatient: adminProcedure
    .input(z.object({ patientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const patient = await ctx.db.patient.findUniqueOrThrow({
        where: { id: input.patientId },
        include: {
          careTeam: { include: { user: true } },
          medications: { where: { active: true } },
          healthChecks: { orderBy: { checkedAt: "desc" }, take: 5 },
          alerts: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });
      return patient;
    }),

  // ── All medications (platform-wide) ─────────────────────────────────────
  listMedications: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        activeOnly: z.boolean().default(true),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }
      if (input.activeOnly) {
        where.active = true;
      }

      const [medications, total] = await Promise.all([
        ctx.db.medication.findMany({
          where,
          include: { patient: true },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.medication.count({ where }),
      ]);

      return {
        medications: medications.map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          scheduleTimes: m.scheduleTimes,
          active: m.active,
          patientName: m.patient.name,
          patientId: m.patient.id,
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // ── Audit logs ──────────────────────────────────────────────────────────
  listAuditLogs: adminProcedure
    .input(
      z.object({
        action: z.string().optional(),
        entity: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.action) where.action = input.action;
      if (input.entity) where.entity = input.entity;

      const [logs, total] = await Promise.all([
        ctx.db.auditLog.findMany({
          where,
          include: { user: true },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.db.auditLog.count({ where }),
      ]);

      return {
        logs: logs.map((l) => ({
          id: l.id,
          action: l.action,
          entity: l.entity,
          entityId: l.entityId,
          detail: l.detail,
          createdAt: l.createdAt,
          userName: l.user.name,
          userEmail: l.user.email,
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // ── Create audit log (internal) ─────────────────────────────────────────
  createAuditLog: adminProcedure
    .input(
      z.object({
        action: z.string(),
        entity: z.string(),
        entityId: z.string(),
        detail: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbUser = await ctx.db.user.findUnique({
        where: { clerkId: ctx.userId },
      });
      if (!dbUser) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      return ctx.db.auditLog.create({
        data: {
          ...input,
          userId: dbUser.id,
        },
      });
    }),

  // ── Roles & Permissions ─────────────────────────────────────────────────
  getRolePermissions: adminProcedure.query(async ({ ctx }) => {
    const permissions = await ctx.db.rolePermission.findMany();
    return permissions;
  }),

  setRolePermission: adminProcedure
    .input(
      z.object({
        role: z.enum([
          "PRIMARY_CAREGIVER",
          "SECONDARY_CAREGIVER",
          "DOCTOR",
          "PATIENT",
          "AGENCY_ADMIN",
          "PLATFORM_ADMIN",
        ]),
        action: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.enabled) {
        // Upsert: create if not exists
        return ctx.db.rolePermission.upsert({
          where: {
            role_action: { role: input.role, action: input.action },
          },
          create: { role: input.role, action: input.action },
          update: {},
        });
      } else {
        // Delete the permission
        await ctx.db.rolePermission.deleteMany({
          where: { role: input.role, action: input.action },
        });
        return null;
      }
    }),

  // ── Update user role ────────────────────────────────────────────────────
  updateUserRole: adminProcedure
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
      const member = await ctx.db.careTeamMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
        include: { user: true },
      });

      // Also update Clerk metadata if user is not pending
      if (!member.user.clerkId.startsWith("pending_")) {
        await clerk.users.updateUserMetadata(member.user.clerkId, {
          publicMetadata: { role: input.role },
        });
      }

      return member;
    }),

  // ── Remove user from team ──────────────────────────────────────────────
  removeTeamMember: adminProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.careTeamMember.delete({
        where: { id: input.memberId },
      });
    }),

  // ── Recent activity feed ────────────────────────────────────────────────
  recentActivity: adminProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      // Get recent audit logs as activity
      const logs = await ctx.db.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      // Also get recent medication logs and health checks
      const [recentMedLogs, recentCheckins] = await Promise.all([
        ctx.db.medicationLog.findMany({
          include: {
            medication: { include: { patient: true } },
            loggedBy: true,
          },
          orderBy: { loggedAt: "desc" },
          take: 5,
        }),
        ctx.db.healthCheck.findMany({
          include: { patient: true, recordedBy: true },
          orderBy: { checkedAt: "desc" },
          take: 5,
        }),
      ]);

      // Merge into a single feed
      type FeedItem = {
        type: string;
        message: string;
        detail: string | null;
        timestamp: Date;
        userName: string;
      };

      const feed: FeedItem[] = [];

      for (const log of logs) {
        feed.push({
          type: log.action,
          message: `${log.action}: ${log.entity} ${log.entityId}`,
          detail: log.detail,
          timestamp: log.createdAt,
          userName: log.user.name,
        });
      }

      for (const ml of recentMedLogs) {
        feed.push({
          type: ml.status === "missed" ? "MISSED_DOSE" : "MED_LOGGED",
          message:
            ml.status === "missed"
              ? `Missed dose alert triggered`
              : `Medication dispensed: ${ml.medication.name}`,
          detail: `Patient: ${ml.medication.patient.name}`,
          timestamp: ml.loggedAt,
          userName: ml.loggedBy.name,
        });
      }

      for (const hc of recentCheckins) {
        feed.push({
          type: "CHECKIN",
          message: `Health check-in recorded`,
          detail: `Patient: ${hc.patient.name}`,
          timestamp: hc.checkedAt,
          userName: hc.recordedBy.name,
        });
      }

      // Sort by time descending
      feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return feed.slice(0, input.limit);
    }),
});
