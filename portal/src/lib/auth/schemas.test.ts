import { describe, expect, it } from "vitest";

import { inviteClientContactSchema, loginSchema } from "@/lib/auth/schemas";

/** Credential validation contract (Zod at the edge of the system). */
describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const parsed = loginSchema.safeParse({ email: "user@example.com", password: "secret123" });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email shapes", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "secret123" }).success).toBe(false);
  });

  it("rejects empty or oversized passwords", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "user@example.com", password: "x".repeat(1025) }).success).toBe(false);
  });
});

describe("inviteClientContactSchema", () => {
  const valid = {
    clientName: "Acme Corp",
    email: "billing@acme.test",
    tempPassword: "temporary-pass-123",
  };

  it("accepts a well-formed invitation", () => {
    expect(inviteClientContactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects short temporary passwords", () => {
    expect(
      inviteClientContactSchema.safeParse({ ...valid, tempPassword: "short" }).success,
    ).toBe(false);
  });

  it("rejects missing client names and bad emails", () => {
    expect(inviteClientContactSchema.safeParse({ ...valid, clientName: "" }).success).toBe(false);
    expect(inviteClientContactSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });
});
