import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * Later tasks will add the schema under src/lib/db/schema.ts; this placeholder
 * keeps the npm db:* scripts wired up from day one.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
