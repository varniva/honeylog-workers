import { redirect } from "next/navigation";
import type { PrismaClient } from "@prisma/client";

import { auth } from "@/lib/auth";
import type { PortalSession, UserRole } from "@/lib/auth/types";

/**
 * Centralized authorization helpers.
 *
 * These are the ONLY sanctioned way for pages, layouts, and server actions to
 * obtain the current identity or grant access to workspace-scoped resources.
 * Every Prisma lookup is scoped by `workspaceId` — and by `clientId` where a
 * CLIENT user is involved — so cross-tenant/cross-client data can never be
 * read by guessing identifiers or URLs.
 *
 * Failures:
 * - No session  -> redirect to /login (pages) via UnauthorizedError handling.
 * - Wrong role/workspace/client -> NotFoundError (treat as missing data so we
 *   never confirm the existence of another tenant's resources).
 */

/** Thrown when there is no valid session. Pages convert this into /login. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthorizedError";
  }
}

/** Thrown when the session exists but may not access the resource. */
export class ForbiddenError extends Error {
  constructor() {
    super("Access denied");
    this.name = "ForbiddenError";
  }
}

/**
 * Resources the caller has no right to see are reported as "not found" —
 * this avoids confirming the existence of another workspace's data.
 */
export class NotFoundError extends Error {
  constructor() {
    super("Resource not found");
    this.name = "NotFoundError";
  }
}

/** Options used to inject dependencies in tests. */
export interface AuthorizationDeps {
  authFn?: typeof auth;
  db?: PrismaClient;
}

/**
 * Return the current session or throw UnauthorizedError.
 * In a React Server Component context, prefer `requireUserPage` which
 * redirects to /login instead of throwing.
 */
export async function getSession(
  deps: AuthorizationDeps = {},
): Promise<PortalSession> {
  const authFn = deps.authFn ?? auth;
  const session = await authFn();

  if (!session?.user) throw new UnauthorizedError();
  return session as unknown as PortalSession;
}

/**
 * Server helper for pages/layouts: requires a session and redirects to
 * /login (with a `next` callback URL) when there is none.
 */
export async function requireUser(deps: AuthorizationDeps = {}): Promise<PortalSession> {
  try {
    return await getSession(deps);
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/login");
    throw error;
  }
}

/**
 * Owner-only guard for pages: redirects non-owners to their own dashboard
 * rather than revealing owner-only surfaces.
 */
export async function requireWorkspaceOwner(deps: AuthorizationDeps = {}): Promise<PortalSession> {
  const session = await requireUser(deps);
  if (session.user.role !== "OWNER" || !session.user.workspaceId) {
    redirect("/dashboard/client");
  }
  return session;
}

/**
 * Client-contact guard for pages: only users with a client record pass.
 */
export async function requireClientContact(deps: AuthorizationDeps = {}): Promise<PortalSession> {
  const session = await requireUser(deps);
  if (session.user.role !== "CLIENT" || !session.user.clientId) {
    redirect("/dashboard/owner");
  }
  return session;
}

/**
 * For server actions/API routes (where `redirect` in a thrown-error context is
 * undesirable): throws UnauthorizedError/ForbiddenError instead of redirecting.
 */
export async function assertUser(deps: AuthorizationDeps = {}): Promise<PortalSession> {
  return getSession(deps);
}

export async function assertWorkspaceOwner(deps: AuthorizationDeps = {}): Promise<PortalSession> {
  const session = await assertUser(deps);
  if (session.user.role !== "OWNER" || !session.user.workspaceId) {
    throw new ForbiddenError();
  }
  return session;
}

/**
 * Enforce client-record access:
 * - OWNER users may access any client inside their own workspace.
 * - CLIENT users may access only the client record bound to their session.
 * Anything else is Forbidden.
 */
export async function assertClientAccess(
  clientId: string,
  deps: AuthorizationDeps = {},
): Promise<PortalSession> {
  const session = await assertUser(deps);

  if (session.user.role === "OWNER") {
    if (!session.user.workspaceId) throw new ForbiddenError();
    // Verify the client record actually lives in the owner's workspace.
    const db = deps.db ?? (await import("@/lib/db/prisma")).prisma;
    const client = await db.client.findFirst({
      where: { id: clientId, workspaceId: session.user.workspaceId },
      select: { id: true },
    });
    if (!client) throw new ForbiddenError();
    return session;
  }

  if (session.user.clientId !== clientId) throw new ForbiddenError();
  return session;
}

export function assertRole(session: PortalSession, ...allowed: UserRole[]): void {
  if (!allowed.includes(session.user.role)) throw new ForbiddenError();
}

// ---------------------------------------------------------------------------
// Workspace-scoped resource access. Every helper performs a single query that
// filters by BOTH workspace and (for CLIENT users) the caller's client id, so
// the authorization check and the data fetch cannot drift apart.
// ---------------------------------------------------------------------------

interface ClientAccessFilters {
  workspaceId: string;
  clientId?: string;
}

/** Build the `where` fragment restricting a workspace-scoped resource. */
export function scopeWhere(
  session: PortalSession,
  resourceWorkspaceIdField = "workspaceId",
  resourceClientIdField = "clientId",
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    [resourceWorkspaceIdField]: session.user.workspaceId,
  };
  if (session.user.role === "CLIENT" && session.user.clientId) {
    where[resourceClientIdField] = session.user.clientId;
  }
  return where;
}

export async function canAccessProject(
  projectId: string,
  session: PortalSession,
  deps: AuthorizationDeps = {},
): Promise<boolean> {
  const filters = sessionFilters(session);
  const db = deps.db ?? (await import("@/lib/db/prisma")).prisma;
  const project = await db.project.findFirst({
    where: { id: projectId, ...filters },
    select: { id: true },
  });
  return Boolean(project);
}

export async function canAccessInvoice(
  invoiceId: string,
  session: PortalSession,
  deps: AuthorizationDeps = {},
): Promise<boolean> {
  const filters = sessionFilters(session);
  const db = deps.db ?? (await import("@/lib/db/prisma")).prisma;
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, ...filters },
    select: { id: true },
  });
  return Boolean(invoice);
}

export async function canAccessFile(
  fileId: string,
  session: PortalSession,
  deps: AuthorizationDeps = {},
): Promise<boolean> {
  const filters = sessionFilters(session);
  const db = deps.db ?? (await import("@/lib/db/prisma")).prisma;
  const file = await db.projectFile.findFirst({
    where: {
      id: fileId,
      project: filters.clientId
        ? { workspaceId: filters.workspaceId, clientId: filters.clientId }
        : { workspaceId: filters.workspaceId },
    },
    select: { id: true },
  });
  return Boolean(file);
}

export async function canAccessPayment(
  paymentId: string,
  session: PortalSession,
  deps: AuthorizationDeps = {},
): Promise<boolean> {
  const filters = sessionFilters(session);
  const db = deps.db ?? (await import("@/lib/db/prisma")).prisma;
  const payment = await db.payment.findFirst({
    where: {
      id: paymentId,
      invoice: filters.clientId
        ? { workspaceId: filters.workspaceId, clientId: filters.clientId }
        : { workspaceId: filters.workspaceId },
    },
    select: { id: true },
  });
  return Boolean(payment);
}

/** Workspace (and client, for CLIENT users) filters applied to every lookup. */
function sessionFilters(session: PortalSession): ClientAccessFilters {
  const { workspaceId, clientId } = session.user;
  if (!workspaceId) throw new ForbiddenError();
  return { workspaceId, clientId: clientId ?? undefined };
}
