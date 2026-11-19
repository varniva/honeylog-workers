import type { Metadata } from "next";

import { requireUser } from "@/lib/authorization";

export const metadata: Metadata = { title: "Projects" };

/**
 * Protected route: the session is required server-side, and the projects
 * feature (next task) must scope every lookup with `scopeWhere(session)`.
 */
export default async function ProjectsPage() {
  await requireUser();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Projects</h1>
      <p className="max-w-prose text-slate-600">
        Project updates and shared files will appear here once the projects feature is implemented.
      </p>
    </section>
  );
}
