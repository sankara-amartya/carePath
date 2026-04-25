import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

// ─── Database connection ────────────────────────────────────────────────────
// Prisma 7 requires an explicit adapter for direct database connections.
// We use the pg adapter with a connection pool pointed at Neon.

const connectionString = process.env.DATABASE_URL!;

// Prevent multiple Prisma instances in development (Next.js hot-reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
