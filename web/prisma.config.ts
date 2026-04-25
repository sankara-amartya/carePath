import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // The Prisma CLI (Studio, Migrate, etc.) uses this URL.
    // Use your direct (unpooled) Neon URL here to avoid migration hangs!
    url: env("DATABASE_URL"),
  },
});
