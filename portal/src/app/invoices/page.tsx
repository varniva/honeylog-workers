import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices",
};

export default function InvoicesPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Invoices</h1>
      <p className="max-w-prose text-slate-600">
        Invoices and payment status will appear here once the billing feature is implemented.
      </p>
    </section>
  );
}
