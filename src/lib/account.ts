import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

// Auth is on only when Clerk is configured. Without it (local/dev builds with
// no keys) we fall back to the seeded demo user so the app still compiles/runs.
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function sanitizeUsername(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) || "trader";
}

// Just-in-time provisioning: the first time a Clerk user hits the app, create
// their own DB user. Keyed by email (Clerk emails are unique).
async function findOrCreateUser(
  email: string,
  name: string,
  usernameGuess?: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const base = sanitizeUsername(usernameGuess || email.split("@")[0]);
  let username = base;
  let n = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${n++}`;
  }
  return prisma.user.create({ data: { email, username, name: name || base } });
}

// The signed-in user's DB record (cached per request). Returns null when no one
// is signed in (Clerk enabled) — callers/route guards handle that.
export const getCurrentUser = cache(async () => {
  if (CLERK_ENABLED) {
    const cu = await currentUser();
    if (!cu) return null;
    const email =
      cu.primaryEmailAddress?.emailAddress ??
      cu.emailAddresses[0]?.emailAddress ??
      null;
    if (!email) return null;
    const name =
      [cu.firstName, cu.lastName].filter(Boolean).join(" ") ||
      cu.username ||
      email.split("@")[0];
    return findOrCreateUser(email, name, cu.username ?? undefined);
  }

  // Demo fallback (no Clerk keys).
  const email = process.env.DEMO_USER_EMAIL || "edwin@tradenotti.com";
  return prisma.user.findUnique({ where: { email } });
});

export const getCurrentUserEmail = cache(async (): Promise<string | null> => {
  return (await getCurrentUser())?.email ?? null;
});

export const getAccountsForCurrentUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];
  return prisma.account.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { createdAt: "asc" },
  });
});

/**
 * Resolves the active account. Prefers the given id (if it belongs to the
 * current user), otherwise the first account. Reuses the cached account list.
 * For a multi-select param ("all" / "id,id") this returns the first selected
 * account — the single-account context (sync, add-trade, TopBar avatar).
 */
export async function getActiveAccount(accountId?: string) {
  const accounts = await getAccountsForCurrentUser();
  if (accounts.length === 0) return null;
  if (accountId) {
    const ids = parseAccountParam(accountId);
    const match = accounts.find((a) => ids.includes(a.id));
    if (match) return match;
  }
  return accounts[0];
}

function parseAccountParam(param: string): string[] {
  if (param === "all") return ["all"];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Resolves an account-selection param to the set of account ids to query.
 * - undefined → the first account (default single view)
 * - "all"     → every account the user owns (combined view)
 * - "id,id"   → the listed accounts that actually belong to the user
 * Always returns at least one id when the user has any account.
 */
export async function getActiveAccountIds(param?: string): Promise<string[]> {
  const accounts = await getAccountsForCurrentUser();
  if (accounts.length === 0) return [];
  if (!param) return [accounts[0].id];
  if (param === "all") return accounts.map((a) => a.id);
  const requested = parseAccountParam(param);
  const valid = accounts
    .filter((a) => requested.includes(a.id))
    .map((a) => a.id);
  return valid.length > 0 ? valid : [accounts[0].id];
}
