import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";

import {
  assertClientAccess,
  assertUser,
  assertWorkspaceOwner,
  canAccessInvoice,
  canAccessProject,
  ForbiddenError,
  getSession,
  UnauthorizedError,
  type AuthorizationDeps,
} from "@/lib/authorization";
import type { PortalSession } from "@/lib/auth/types";

/**
 * Authorization contract tests.
 *
 * Dependencies are injected (`authFn`, `db`) so these run without Next.js or
 * a real database. They cover: missing sessions, role violations, and
 * cross-client/cross-workspace access attempts.
 */

function makeSession(overrides: Partial<PortalSession["user"]> = {}): PortalSession {
  return {
    user: {
      id: "user-1",
      email: "user@example.test",
      name: "Test User",
      role: "OWNER",
      workspaceId: "ws-1",
      clientId: null,
      ...overrides,
    },
  };
}

function depsWithSession(session: PortalSession | null): AuthorizationDeps {
  return { authFn: vi.fn(async () => session) as AuthorizationDeps["authFn"] };
}

function dbMock(overrides: Record<string, unknown> = {}): PrismaClient {
  return overrides as unknown as PrismaClient;
}

describe("getSession / assertUser", () => {
  it("throws UnauthorizedError when there is no session", async () => {
    await expect(getSession(depsWithSession(null))).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws UnauthorizedError when the session has no user", async () => {
    await expect(
      getSession({ authFn: vi.fn(async () => ({ user: null })) as AuthorizationDeps["authFn"] }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns the session for a logged-in user", async () => {
    const session = makeSession();
    await expect(getSession(depsWithSession(session))).resolves.toBe(session);
  });
});

describe("assertWorkspaceOwner", () => {
  it("throws ForbiddenError for CLIENT users", async () => {
    const session = makeSession({ role: "CLIENT", workspaceId: "ws-1", clientId: "client-1" });
    await expect(assertWorkspaceOwner(depsWithSession(session))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("throws ForbiddenError for owners without a workspace", async () => {
    const session = makeSession({ workspaceId: null });
    await expect(assertWorkspaceOwner(depsWithSession(session))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("passes for owners with a workspace", async () => {
    const session = makeSession();
    await expect(assertWorkspaceOwner(depsWithSession(session))).resolves.toBe(session);
  });
});

describe("assertClientAccess", () => {
  it("forbids a CLIENT user from accessing another client's record", async () => {
    const session = makeSession({ role: "CLIENT", clientId: "client-1" });
    await expect(
      assertClientAccess("client-2", depsWithSession(session)),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows a CLIENT user to access their own client record", async () => {
    const session = makeSession({ role: "CLIENT", workspaceId: "ws-1", clientId: "client-1" });
    await expect(
      assertClientAccess("client-1", {
        ...depsWithSession(session),
        db: dbMock({ client: { findFirst: vi.fn(async () => ({ id: "client-1" })) } }),
      }),
    ).resolves.toBe(session);
  });

  it("forbids an OWNER from accessing a client outside their workspace", async () => {
    const session = makeSession({ workspaceId: "ws-1" });
    await expect(
      assertClientAccess("client-other", {
        ...depsWithSession(session),
        db: dbMock({ client: { findFirst: vi.fn(async () => null) } }),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("allows an OWNER to access a client inside their workspace", async () => {
    const session = makeSession({ workspaceId: "ws-1" });
    await expect(
      assertClientAccess("client-1", {
        ...depsWithSession(session),
        db: dbMock({ client: { findFirst: vi.fn(async () => ({ id: "client-1" })) } }),
      }),
    ).resolves.toBe(session);
  });
});

describe("workspace-scoped resource access", () => {
  it("denies projects outside the caller's workspace", async () => {
    const session = makeSession();
    const db = dbMock({
      project: { findFirst: vi.fn(async () => null) },
    });
    await expect(
      canAccessProject("project-1", session, { db, authFn: vi.fn() as AuthorizationDeps["authFn"] }),
    ).resolves.toBe(false);

    // The lookup must be scoped by workspace (and client for CLIENT users).
    expect((db.project.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0].where).toEqual({
      id: "project-1",
      workspaceId: "ws-1",
    });
  });

  it("scopes CLIENT users to their own client id", async () => {
    const session = makeSession({ role: "CLIENT", clientId: "client-1" });
    const db = dbMock({
      project: { findFirst: vi.fn(async () => ({ id: "project-1" })) },
    });
    await expect(
      canAccessProject("project-1", session, { db, authFn: vi.fn() as AuthorizationDeps["authFn"] }),
    ).resolves.toBe(true);

    expect((db.project.findFirst as ReturnType<typeof vi.fn>).mock.calls[0][0].where).toEqual({
      id: "project-1",
      workspaceId: "ws-1",
      clientId: "client-1",
    });
  });

  it("denies invoices belonging to another client", async () => {
    const session = makeSession({ role: "CLIENT", clientId: "client-1" });
    const db = dbMock({ invoice: { findFirst: vi.fn(async () => null) } });
    await expect(
      canAccessInvoice("invoice-9", session, { db, authFn: vi.fn() as AuthorizationDeps["authFn"] }),
    ).resolves.toBe(false);
  });
});
