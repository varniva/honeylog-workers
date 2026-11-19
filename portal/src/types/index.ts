/**
 * Shared application-wide types.
 *
 * Domain types (Client, Project, Invoice, etc.) will live in domain-specific
 * files under src/types as later tasks are implemented.
 */

/** Placeholder for future domain models. */
export type Id = string;

export interface AppUser {
  id: Id;
  email: string;
  name: string;
  role: "freelancer" | "client";
}
