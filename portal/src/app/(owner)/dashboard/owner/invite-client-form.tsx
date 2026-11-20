"use client";

import { useActionState } from "react";

import { inviteClientContactAction, type InviteClientActionState } from "@/lib/actions/clients";

const initialState: InviteClientActionState = {};

/**
 * Owner-only form to create a client contact account with a temporary
 * password. The password is hashed server-side (Argon2id) before persistence.
 */
export default function InviteClientForm() {
  const [state, formAction, isPending] = useActionState(inviteClientContactAction, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">Invite a client contact</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="clientName" className="block text-sm font-medium text-slate-700">
            Client name
          </label>
          <input
            id="clientName"
            name="clientName"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Contact email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="tempPassword" className="block text-sm font-medium text-slate-700">
          Temporary password (min. 12 characters)
        </label>
        <input
          id="tempPassword"
          name="tempPassword"
          type="text"
          autoComplete="off"
          minLength={12}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        />
      </div>

      {state.error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
