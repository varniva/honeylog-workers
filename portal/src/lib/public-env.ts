import { z } from "zod";

/**
 * Public (browser-safe) environment schema.
 *
 * Only variables prefixed with NEXT_PUBLIC_ may appear here — they are inlined
 * into the client bundle and visible to anyone who opens the app. Secrets stay
 * in `env.ts`, which is server-only.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL (e.g. http://localhost:3000)")
    .default("http://localhost:3000"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cached) return cached;

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid public environment variables:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}
