import { prisma } from "./db";

// Until auth is added, "the current user" is the seeded demo user. This is the
// single seam to replace with a real session lookup later.
export async function getCurrentUserEmail(): Promise<string> {
  return process.env.DEMO_USER_EMAIL || "edwin@tradenotti.com";
}

export async function getCurrentUser() {
  const email = await getCurrentUserEmail();
  return prisma.user.findUnique({ where: { email } });
}

export async function getAccountsForCurrentUser() {
  const email = await getCurrentUserEmail();
  return prisma.account.findMany({
    where: { user: { email } },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Resolves the active account. Prefers the given id (if it belongs to the
 * current user), otherwise the first account.
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
