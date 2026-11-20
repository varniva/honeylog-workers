import { hash, verify } from "@node-rs/argon2";

/**
 * Password hashing utilities.
 *
 * Passwords are stored ONLY as Argon2id hashes. Argon2id is the recommended
 * variant (resistant to both side-channel and GPU attacks). The parameters
 * below follow OWASP guidance (m=19456 KiB, t=2, p=1).
 */

const ARGON2ID_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/** Hash a plaintext password with Argon2id. Never persist the plaintext. */
export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2ID_OPTIONS);
}

/**
 * Constant-time verification of a plaintext password against an Argon2id hash.
 * Returns false for malformed hashes instead of throwing, so bad data can never
 * leak a distinguishable error path.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password, ARGON2ID_OPTIONS);
  } catch {
    return false;
  }
}
