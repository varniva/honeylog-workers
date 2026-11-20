import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration.
 *
 * This file is imported by middleware.ts, which runs in the Edge runtime —
 * it must not touch Prisma or Node-only modules (argon2, etc.). Database
 * lookups and password verification happen only in the credentials
 * `authorize` callback defined in src/lib/auth/index.ts.
 *
 * Session strategy is JWT (stateless) with HTTP-only, secure cookies.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  callbacks: {
    /**
     * Enrich the token/session with the authorization-critical claims:
     * role, workspaceId, and clientId. Route protection and data scoping
     * read these values — never trust client-supplied identity.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId;
        token.clientId = user.clientId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "OWNER" | "CLIENT";
        session.user.workspaceId = token.workspaceId as string | null;
        session.user.clientId = token.clientId as string | null;
      }
      return session;
    },
  },
  providers: [], // Credentials provider is added in src/lib/auth/index.ts (Node runtime).
} satisfies NextAuthConfig;
