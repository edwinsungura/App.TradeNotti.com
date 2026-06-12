import { prisma } from "../db";
import { computeJournalStats } from "./stats";
import { generateDailyInsight } from "./insight";

// UTC midnight for "today" — the cache key granularity (one insight per day).
function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export interface TodayInsight {
  category: string;
  text: string;
  date: string; // ISO date
  source: string;
  cached: boolean;
}

/**
 * Returns today's insight for an account, generating and caching it once per
 * day. Subsequent calls the same day return the stored row (no re-generation).
 */
export async function getTodayInsight(
  accountId: string,
  { force = false } = {},
): Promise<TodayInsight> {
  const date = todayUtc();

  if (!force) {
    const existing = await prisma.dailyInsight.findUnique({
      where: { accountId_date: { accountId, date } },
    });
    if (existing) {
      return {
        category: existing.category,
        text: existing.text,
        date: date.toISOString().slice(0, 10),
        source: existing.source,
        cached: true,
      };
    }
  }

  const stats = await computeJournalStats(accountId);
  const generated = await generateDailyInsight(stats);

  const saved = await prisma.dailyInsight.upsert({
    where: { accountId_date: { accountId, date } },
    create: {
      accountId,
      date,
      category: generated.category,
      text: generated.text,
      source: generated.source,
      metrics: stats as unknown as object,
    },
    update: {
      category: generated.category,
      text: generated.text,
      source: generated.source,
      metrics: stats as unknown as object,
    },
  });

  return {
    category: saved.category,
    text: saved.text,
    date: date.toISOString().slice(0, 10),
    source: saved.source,
    cached: false,
  };
}
