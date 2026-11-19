import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import LoginForm from "./login-form";

export const metadata: Metadata = { title: "Log in" };

/**
 * Public authentication page (public `(auth)` route group).
 *
 * Authenticated users never see this page — middleware redirects them to the
 * dashboard matching their role, and we re-check server-side here too.
 */
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "OWNER" ? "/dashboard/owner" : "/dashboard/client");
  }

  return (
    <section className="mx-auto w-full max-w-sm space-y-6 py-12">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
        <p className="text-sm text-slate-600">
          Access your projects, files, and invoices.
        </p>
      </header>
      <LoginForm />
      <p className="text-center text-xs text-slate-500">
        Accounts are created by invitation from the workspace owner.
      </p>
    </section>
  );
}
