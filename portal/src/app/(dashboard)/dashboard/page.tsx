import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/authorization";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Role router: bounces authenticated users to the dashboard matching their
 * role. Authorization itself is re-checked server-side in each dashboard.
 */
export default async function DashboardPage() {
  const session = await requireUser();
  redirect(session.user.role === "OWNER" ? "/dashboard/owner" : "/dashboard/client");
}
