import type { Metadata } from "next";

import { requireWorkspaceOwner } from "@/lib/authorization";
import SignOutButton from "@/components/SignOutButton";
import InviteClientForm from "./invite-client-form";

export const metadata: Metadata = { title: "Owner dashboard" };

/**
 * Owner-only dashboard (protected `(owner)` route group).
 *
 * Access is enforced server-side with requireWorkspaceOwner — clients landing
 * here are bounced to their own dashboard, never shown owner data.
 */
export default async function OwnerDashboardPage() {
  const session = await requireWorkspaceOwner();

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Owner dashboard</h1>
          <p className="text-sm text-slate-600">Signed in as {session.user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <p className="max-w-prose text-slate-600">
        Manage clients, project updates, files, and invoices. Client contacts can
        only see the projects and billing belonging to their own client record.
      </p>

      <InviteClientForm />
    </section>
  );
}
