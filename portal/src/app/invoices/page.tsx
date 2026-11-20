import type { Metadata } from "next";

import { requireUser } from "@/lib/authorization";

export const metadata: Metadata = { title: "Invoices" };

/**
 * Protected route: the session is required server-side, and the billing
 * feature (next task) must scope every lookup with `scopeWhere(session)`.
 */
export default async function InvoicesPage() {
  await requireUser();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Invoices</h1>
      <p className="max-w-prose text-slate-600">
        Invoices and payment status will appear here once the billing feature is implemented.
      </p>
    </section>
  );
}
