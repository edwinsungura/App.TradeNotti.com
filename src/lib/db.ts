import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in dev to avoid exhausting
// database connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Account selection can be a single id or several (multi-account view). Build a
// Prisma `accountId` filter from either shape.
export type AccountScope = string | string[];
export const accountWhere = (scope: AccountScope) =>
  Array.isArray(scope) ? { in: scope } : scope;
