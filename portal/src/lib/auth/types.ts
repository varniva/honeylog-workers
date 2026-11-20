/**
 * Application session shapes.
 *
 * Auth.js module augmentation lives in src/types/next-auth.d.ts; this file
 * holds plain TypeScript shapes used by authorization helpers so server
 * actions and tests can construct/compare sessions without the runtime.
 */
export type UserRole = "OWNER" | "CLIENT";

export interface PortalSessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Workspace the user owns (OWNER) or belongs to via their client (CLIENT). */
  workspaceId: string | null;
  /** Set only for CLIENT users — scopes every lookup they may perform. */
  clientId: string | null;
}

export interface PortalSession {
  user: PortalSessionUser;
  expires?: string;
}
