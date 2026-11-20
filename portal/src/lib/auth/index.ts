import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/auth/schemas";
import { authConfig } from "@/lib/auth/config";

/**
 * Auth.js (NextAuth v5) instance.
 *
 * This MVP is credentials-only with stateless JWT sessions, so no database
 * session adapter is wired up; user lookup and password verification happen
 * in the credentials `authorize` callback below (Node runtime only).
 *
 * Login errors are always generic ("Invalid email or password") to avoid
 * leaking which accounts exist.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        // 1. Validate shape with Zod — invalid input is just a failed login.
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Look up the user (case-insensitive on email).
        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          include: { client: true, ownedWorkspace: true },
        });
        if (!user) return null;

        // 3. Verify the Argon2id hash. A missing/broken hash simply fails.
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        // 4. Only expose authorization-critical fields to the session.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          workspaceId: user.ownedWorkspace?.id ?? user.workspaceId ?? null,
          clientId: user.clientId ?? null,
        } as const;
      },
    }),
  ],
});
