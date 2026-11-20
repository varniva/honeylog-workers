import type { Metadata } from "next";

import { requireClientContact } from "@/lib/authorization";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = { title: "Client dashboard" };

/**
 * Client-only dashboard (protected `(client)` route group).
 *
 * requireClientContact ensures only users bound to a client record get here;
 * every downstream lookup is additionally scoped to that client's own data.
 */
export default async function ClientDashboardPage() {
  const session = await requireClientContact();

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Client dashboard</h1>
          <p className="text-sm text-slate-600">Signed in as {session.user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <p className="max-w-prose text-slate-600">
        Project updates, shared files, invoices, and payment history for your
        account appear here.
      </p>
    </section>
  );
}
