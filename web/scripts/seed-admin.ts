/**
 * Seed script: Create the Platform Admin user
 * 
 * Run with: npx tsx scripts/seed-admin.ts
 * 
 * Prerequisites:
 *   1. The user amartyasnkr@gmail.com must already have a Clerk account (sign up first)
 *   2. Copy their Clerk user ID from the Clerk dashboard
 *   3. Set it in ADMIN_CLERK_ID below (or pass as env var)
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { createClerkClient } from "@clerk/backend";
import "dotenv/config";

const ADMIN_EMAIL = "amartyasnkr@gmail.com";

async function main() {
  // ── DB connection ──────────────────────────────────────────────────────
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  });

  console.log("🔍 Looking up Clerk user for:", ADMIN_EMAIL);

  // Find the Clerk user by email
  const clerkUsers = await clerk.users.getUserList({
    emailAddress: [ADMIN_EMAIL],
  });

  if (clerkUsers.data.length === 0) {
    console.error(
      "❌ No Clerk user found for", ADMIN_EMAIL,
      "\n   → Sign up at the app first, then re-run this script."
    );
    process.exit(1);
  }

  const clerkUser = clerkUsers.data[0];
  console.log("✅ Found Clerk user:", clerkUser.id);

  // ── Ensure DB user exists ─────────────────────────────────────────────
  let dbUser = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
          : ADMIN_EMAIL.split("@")[0],
        clerkId: clerkUser.id,
      },
    });
    console.log("✅ Created DB user:", dbUser.id);
  } else {
    // Make sure clerkId is correct (in case it was a placeholder)
    if (dbUser.clerkId !== clerkUser.id) {
      await db.user.update({
        where: { id: dbUser.id },
        data: { clerkId: clerkUser.id },
      });
      console.log("✅ Updated DB user clerkId to:", clerkUser.id);
    } else {
      console.log("✅ DB user already exists:", dbUser.id);
    }
  }

  // ── Set Clerk public metadata ─────────────────────────────────────────
  await clerk.users.updateUserMetadata(clerkUser.id, {
    publicMetadata: {
      role: "PLATFORM_ADMIN",
    },
  });
  console.log("✅ Set Clerk publicMetadata.role = PLATFORM_ADMIN");

  // ── Seed default role permissions ─────────────────────────────────────
  const defaultPermissions: Record<string, string[]> = {
    PRIMARY_CAREGIVER: [
      "LOG_MEDICATION", "EDIT_MEDICATIONS", "MANAGE_TEAM",
      "GENERATE_AI_SUMMARY", "VIEW_HEALTH_TIMELINE", "VERIFY_PILL_PHOTO",
      "VOICE_JOURNAL", "RESOLVE_ALERTS", "DOWNLOAD_APPT_BRIEF",
    ],
    SECONDARY_CAREGIVER: [
      "LOG_MEDICATION", "VERIFY_PILL_PHOTO", "VOICE_JOURNAL",
      "VIEW_HEALTH_TIMELINE", "RESOLVE_ALERTS",
    ],
    DOCTOR: ["VIEW_HEALTH_TIMELINE", "DOWNLOAD_APPT_BRIEF"],
    PATIENT: ["VIEW_HEALTH_TIMELINE"],
    AGENCY_ADMIN: ["VIEW_HEALTH_TIMELINE", "MANAGE_TEAM"],
    PLATFORM_ADMIN: [
      "LOG_MEDICATION", "EDIT_MEDICATIONS", "MANAGE_TEAM",
      "GENERATE_AI_SUMMARY", "VIEW_HEALTH_TIMELINE", "VERIFY_PILL_PHOTO",
      "VOICE_JOURNAL", "RESOLVE_ALERTS", "DOWNLOAD_APPT_BRIEF",
    ],
  };

  let permCount = 0;
  for (const [role, actions] of Object.entries(defaultPermissions)) {
    for (const action of actions) {
      await db.rolePermission.upsert({
        where: { role_action: { role: role as never, action } },
        create: { role: role as never, action },
        update: {},
      });
      permCount++;
    }
  }
  console.log(`✅ Seeded ${permCount} role permissions`);

  // ── Seed an initial audit log ─────────────────────────────────────────
  await db.auditLog.create({
    data: {
      action: "ADMIN_SEEDED",
      entity: "User",
      entityId: dbUser.id,
      detail: `Platform admin seeded: ${ADMIN_EMAIL}`,
      userId: dbUser.id,
    },
  });
  console.log("✅ Created initial audit log entry");

  console.log("\n🎉 Platform Admin setup complete!");
  console.log("   Email:", ADMIN_EMAIL);
  console.log("   Clerk ID:", clerkUser.id);
  console.log("   DB User ID:", dbUser.id);
  console.log("   Role: PLATFORM_ADMIN");
  console.log("\n   Login at the app → you'll be redirected to /admin");

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
