"use client";

import { useTransition } from "react";

import { logoutAction } from "@/lib/actions/auth";

/** Client control that invokes the logout server action. */
export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
