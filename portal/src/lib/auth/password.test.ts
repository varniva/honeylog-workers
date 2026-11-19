import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * Password hashing contract:
 * - Passwords are stored only as Argon2id hashes (prefix $argon2id$).
 * - Verification fails for wrong passwords and malformed hashes, never throws.
 */
describe("password hashing", () => {
  it("produces an Argon2id hash that verifies for the correct password", async () => {
    const password = "correct horse battery staple";
    const hash = await hashPassword(password);

    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("hunter2hunter2hunter2");
    await expect(verifyPassword("hunter3hunter3hunter3", hash)).resolves.toBe(false);
  });

  it("returns false instead of throwing for malformed hashes", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false);
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
  });

  it("produces a unique salt per hash", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same-password"),
      hashPassword("same-password"),
    ]);
    expect(a).not.toBe(b);
  });
});
