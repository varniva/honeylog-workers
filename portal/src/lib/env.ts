import { z } from "zod";

/**
 * Server-only environment schema.
 *
 * This module validates and exposes server-side secrets. It must never be
 * imported from a component marked with "use client" or any code that runs in
 * the browser — public variables belong in `public-env.ts`.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (e.g. postgresql://user:pass@host:5432/db)"),

  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters (generate with: openssl rand -base64 32)"),

  APP_URL: z.string().url("APP_URL must be a valid URL (e.g. http://localhost:3000)"),

  // Object storage — optional until the file-sharing task lands.
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Parse and cache server environment variables.
 * Throws a readable error listing every invalid or missing variable.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment variables:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}
