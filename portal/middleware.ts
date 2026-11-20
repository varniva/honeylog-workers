import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/config";

/**
 * Edge middleware: coarse-grained route protection.
 *
 * This is a lightweight Auth.js instance built from the edge-safe config
 * (no Prisma/argon2 — those are Node-only and live in src/lib/auth/index.ts).
 * It blocks unauthenticated access to protected areas and redirects
 * already-authenticated users away from public auth pages.
 *
 * IMPORTANT: this is the FIRST layer of defense only. Every protected page,
 * server action, and data lookup must also enforce policy via the server-side
 * helpers in src/lib/authorization — never rely on middleware or hidden UI.
 */

const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Route-level policy:
     * - Unauthenticated users hitting protected routes -> /login
     * - Authenticated users hitting /login -> their role's dashboard
     * - Everything else passes; pages re-check authorization server-side.
     */
    authorized({ request, auth: session }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(session?.user);

      const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/invoices") ||
        pathname.startsWith("/settings");
      const isAuthPage = pathname.startsWith("/login");

      if (isAuthPage && isLoggedIn) {
        const role = session?.user?.role;
        return Response.redirect(
          new URL(role === "OWNER" ? "/dashboard/owner" : "/dashboard/client", request.nextUrl),
        );
      }
      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", request.nextUrl));
      }
      return true;
    },
  },
});

// Next.js App Router picks up `middleware` as the named middleware export.
export { auth as middleware };

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)).*)",
  ],
};
