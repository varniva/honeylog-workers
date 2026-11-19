import type { DefaultSession } from "next-auth";

/**
 * Module augmentation for Auth.js: persist role/workspace/client claims on
 * both the JWT and the session user so authorization helpers never rely on
 * extra database round-trips for identity.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "OWNER" | "CLIENT";
      workspaceId: string | null;
      clientId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "OWNER" | "CLIENT";
    workspaceId: string | null;
    clientId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "OWNER" | "CLIENT";
    workspaceId: string | null;
    clientId: string | null;
  }
}
