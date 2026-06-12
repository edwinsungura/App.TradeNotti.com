import { PrismaClient, type Prisma } from "@prisma/client";
import { syncAccountTrades } from "../src/lib/broker-sync";

const prisma = new PrismaClient();

// Build an openedAt N days ago at a specific UTC hour (drives session stats).
function at(daysAgo: number, utcHour: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(utcHour, 30, 0, 0);
  return d;
}

interface SeedTrade {
  symbol: string;
  direction: "LONG" | "SHORT";
  grade: "HIGH_PROBABILITY" | "LOW_PROBABILITY";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  pnl: number;
  rMultiple: number;
  openedAt: Date;
  tags: string[];
}

// Historical CLOSED trades. London-session (08:00 UTC) trades intentionally
// outperform New York-session (14:00 UTC) trades so the deterministic insight
// surfaces a real, data-derived edge.
const CLOSED_TRADES: SeedTrade[] = [
  // London session — strong
  { symbol: "XAU/USD", direction: "LONG", grade: "HIGH_PROBABILITY", entry: 2342.1, stopLoss: 2336.8, takeProfit: 2358.4, pnl: 612, rMultiple: 3.1, openedAt: at(1, 8), tags: ["Breakout", "A+ setup"] },
  { symbol: "AUD/USD", direction: "SHORT", grade: "HIGH_PROBABILITY", entry: 0.6642, stopLoss: 0.6658, takeProfit: 0.661, pnl: 192, rMultiple: 1.4, openedAt: at(3, 8), tags: ["Confirmation", "London open"] },
  { symbol: "XAU/USD", direction: "LONG", grade: "HIGH_PROBABILITY", entry: 2328.4, stopLoss: 2322.1, takeProfit: 2342.2, pnl: 410, rMultiple: 2.2, openedAt: at(4, 8), tags: ["Trend cont.", "London open"] },
  { symbol: "GBP/USD", direction: "SHORT", grade: "HIGH_PROBABILITY", entry: 1.2684, stopLoss: 1.2702, takeProfit: 1.2642, pnl: 218, rMultiple: 2.3, openedAt: at(5, 8), tags: ["Reversal", "London open"] },
  { symbol: "EUR/USD", direction: "LONG", grade: "HIGH_PROBABILITY", entry: 1.084, stopLoss: 1.0826, takeProfit: 1.0872, pnl: 245, rMultiple: 2.0, openedAt: at(7, 8), tags: ["Confirmation", "London open"] },
  // New York session — weaker
  { symbol: "USD/CAD", direction: "LONG", grade: "LOW_PROBABILITY", entry: 1.3621, stopLoss: 1.3605, takeProfit: 1.3652, pnl: -160, rMultiple: -1.0, openedAt: at(3, 14), tags: ["News play"] },
  { symbol: "EUR/GBP", direction: "LONG", grade: "LOW_PROBABILITY", entry: 0.8412, stopLoss: 0.8402, takeProfit: 0.8432, pnl: 95, rMultiple: 1.0, openedAt: at(4, 14), tags: ["VWAP bounce"] },
  { symbol: "NZD/USD", direction: "LONG", grade: "LOW_PROBABILITY", entry: 0.5982, stopLoss: 0.5972, takeProfit: 0.6002, pnl: -100, rMultiple: -1.0, openedAt: at(6, 14), tags: ["Confirmation"] },
  { symbol: "GBP/JPY", direction: "SHORT", grade: "LOW_PROBABILITY", entry: 194.9, stopLoss: 195.2, takeProfit: 194.2, pnl: -185, rMultiple: -1.0, openedAt: at(8, 14), tags: ["News"] },
  { symbol: "EUR/USD", direction: "LONG", grade: "HIGH_PROBABILITY", entry: 1.0795, stopLoss: 1.0781, takeProfit: 1.0828, pnl: 230, rMultiple: 2.3, openedAt: at(9, 14), tags: ["Trend cont."] },
];

const RULES: { text: string; category: "TIMING" | "RISK" | "ENTRY" | "MANAGEMENT"; order: number }[] = [
  { text: "No trades in the first 5 minutes of London open.", category: "TIMING", order: 1 },
  { text: "Risk per trade ≤ 1% of account.", category: "RISK", order: 2 },
  { text: "Must have entry confirmation candle on execution timeframe.", category: "ENTRY", order: 3 },
  { text: "Never add to a losing position.", category: "MANAGEMENT", order: 4 },
];

async function main() {
  const email = process.env.DEMO_USER_EMAIL || "edwin@tradenotti.com";

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: "Edwin" },
    update: { name: "Edwin" },
  });

  // One account per user in the seed; keyed by label for idempotency.
  let account = await prisma.account.findFirst({
    where: { userId: user.id, label: "FTMO 100k" },
  });
  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        label: "FTMO 100k",
        broker: "MetaTrader 5",
        currency: "USD",
        type: "LIVE",
        balance: 100000,
      },
    });
  }

  // Reset trades/rules for a clean, repeatable seed.
  await prisma.trade.deleteMany({ where: { accountId: account.id } });
  await prisma.rule.deleteMany({ where: { accountId: account.id } });

  // Tags (unique by name).
  const tagNames = [...new Set(CLOSED_TRADES.flatMap((t) => t.tags))];
  const tagByName = new Map<string, string>();
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    tagByName.set(name, tag.id);
  }

  for (const t of CLOSED_TRADES) {
    await prisma.trade.create({
      data: {
        accountId: account.id,
        symbol: t.symbol,
        direction: t.direction,
        status: "CLOSED",
        grade: t.grade,
        entry: t.entry,
        stopLoss: t.stopLoss,
        takeProfit: t.takeProfit,
        exitPrice: t.takeProfit,
        pnl: t.pnl,
        rMultiple: t.rMultiple,
        openedAt: t.openedAt,
        closedAt: t.openedAt,
        tags: {
          create: t.tags.map((name) => ({ tagId: tagByName.get(name)! })),
        } satisfies Prisma.TagsOnTradesCreateNestedManyWithoutTradeInput,
      },
    });
  }

  for (const r of RULES) {
    await prisma.rule.create({
      data: {
        accountId: account.id,
        text: r.text,
        category: r.category,
        order: r.order,
      },
    });
  }

  // Populate open trades from the broker (mock by default).
  const synced = await syncAccountTrades(account.id);

  // Broker feeds don't carry a trader's grade/tags — decorate the seeded open
  // positions so the demo Today page looks like the screenshots.
  const decoration: Record<
    string,
    { grade: "HIGH_PROBABILITY" | "LOW_PROBABILITY"; tags: string[] }
  > = {
    "EUR/USD": { grade: "HIGH_PROBABILITY", tags: ["Confirmation", "London open"] },
    "GBP/JPY": { grade: "LOW_PROBABILITY", tags: ["Reversal", "News"] },
    "XAU/USD": { grade: "HIGH_PROBABILITY", tags: ["Breakout"] },
  };
  const openTrades = await prisma.trade.findMany({
    where: { accountId: account.id, status: "OPEN" },
  });
  for (const t of openTrades) {
    const dec = decoration[t.symbol];
    if (!dec) continue;
    const tagIds: string[] = [];
    for (const name of dec.tags) {
      const tag = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      tagIds.push(tag.id);
    }
    await prisma.trade.update({
      where: { id: t.id },
      data: {
        grade: dec.grade,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });
  }

  console.log(
    `Seeded user=${user.name} account=${account.label}: ` +
      `${CLOSED_TRADES.length} closed, ${RULES.length} rules, ` +
      `${synced.open} open positions synced.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
