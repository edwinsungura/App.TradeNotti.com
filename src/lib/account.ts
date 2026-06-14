import { cache } from "react";
import { prisma } from "./db";

// Until auth is added, "the current user" is the seeded demo user. This is the
// single seam to replace with a real session lookup later.
export const getCurrentUserEmail = cache(async (): Promise<string> => {
  return process.env.DEMO_USER_EMAIL || "edwin@tradenotti.com";
});

// Wrapped in React cache() so repeated calls within one server request hit the
// database once instead of re-querying per call site.
export const getCurrentUser = cache(async () => {
  const email = await getCurrentUserEmail();
  return prisma.user.findUnique({ where: { email } });
});

export const getAccountsForCurrentUser = cache(async () => {
  const email = await getCurrentUserEmail();
  return prisma.account.findMany({
    where: { user: { email } },
    orderBy: { createdAt: "asc" },
  });
});

/**
 * Resolves the active account. Prefers the given id (if it belongs to the
 * current user), otherwise the first account. Reuses the cached account list.
 */
export async function getActiveAccount(accountId?: string) {
  const accounts = await getAccountsForCurrentUser();
  if (accounts.length === 0) return null;
  if (accountId) {
    const match = accounts.find((a) => a.id === accountId);
    if (match) return match;
  }
  return accounts[0];
}
