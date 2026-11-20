import { PrismaClient } from "@prisma/client";

/**
 * Shared Prisma client instance.
 *
 * Next.js hot-reloads modules in development; without this guard every reload
 * would open a new connection pool and exhaust the database.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
