import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Client Portal" };

/**
 * Home route: sends authenticated users straight to the dashboard matching
 * their role; anonymous visitors go to login.
 */
export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(session.user.role === "OWNER" ? "/dashboard/owner" : "/dashboard/client");
}
