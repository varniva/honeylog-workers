import { z } from "zod";

/**
 * Zod schemas for authentication inputs.
 *
 * Credentials are validated at the edge of the system so malformed or
 * oversized input never reaches the database or the password verifier.
 */

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255),
  password: z.string().min(1, "Password is required").max(1024),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Owner-only client-contact invitation payload. The `tempPassword` is
 * generated/collected by the owner and hashed before persistence.
 */
export const inviteClientContactSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required").max(120),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(255),
  tempPassword: z
    .string()
    .min(12, "Temporary password must be at least 12 characters")
    .max(1024),
});

export type InviteClientContactInput = z.infer<typeof inviteClientContactSchema>;
