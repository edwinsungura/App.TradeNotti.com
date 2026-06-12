import { prisma } from "../db";

export interface SessionStat {
  session: "London" | "New York" | "Asia";
  trades: number;
  avgR: number;
}

export interface SetupStat {
  tag: string;
  trades: number;
  winRate: number; // 0..1
  netPnl: number;
}

export interface JournalStats {
  closedTrades: number;
  wins: number;
  losses: number;
  winRate: number; // 0..1
  avgR: number;
  netPnl: number;
  sessions: SessionStat[];
  setups: SetupStat[];
  // Best session by avgR and its edge (R) over the next-best.
  bestSession?: { session: string; avgR: number; edgeR: number; over: string };
  bestSetup?: SetupStat;
}

function classifySession(openedAt: Date): SessionStat["session"] {
  const h = openedAt.getUTCHours();
  if (h >= 7 && h < 12) return "London";
  if (h >= 12 && h < 17) return "New York";
  return "Asia";
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/** Aggregates closed-trade journal stats for an account over the last `days`. */
export async function computeJournalStats(
  accountId: string,
  days = 30,
): Promise<JournalStats> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const trades = await prisma.trade.findMany({
    where: { accountId, status: "CLOSED", openedAt: { gte: since } },
    include: { tags: { include: { tag: true } } },
  });

  const closedTrades = trades.length;
  let wins = 0;
  let losses = 0;
  let rSum = 0;
  let rCount = 0;
  let netPnl = 0;

  const sessionAcc = new Map<string, { r: number; n: number }>();
  const setupAcc = new Map<string, { wins: number; n: number; pnl: number }>();

  for (const t of trades) {
    const pnl = t.pnl ? Number(t.pnl) : 0;
    const r = t.rMultiple != null ? Number(t.rMultiple) : null;
    netPnl += pnl;
    if (pnl > 0) wins++;
    else if (pnl < 0) losses++;
    if (r != null) {
      rSum += r;
      rCount++;
      const s = classifySession(t.openedAt);
      const cur = sessionAcc.get(s) ?? { r: 0, n: 0 };
      cur.r += r;
      cur.n++;
      sessionAcc.set(s, cur);
    }
    for (const tt of t.tags) {
      const name = tt.tag.name;
      const cur = setupAcc.get(name) ?? { wins: 0, n: 0, pnl: 0 };
      cur.n++;
      cur.pnl += pnl;
      if (pnl > 0) cur.wins++;
      setupAcc.set(name, cur);
    }
  }

  const sessions: SessionStat[] = [...sessionAcc.entries()]
    .map(([session, v]) => ({
      session: session as SessionStat["session"],
      trades: v.n,
      avgR: round(v.r / v.n),
    }))
    .sort((a, b) => b.avgR - a.avgR);

  const setups: SetupStat[] = [...setupAcc.entries()]
    .map(([tag, v]) => ({
      tag,
      trades: v.n,
      winRate: round(v.wins / v.n, 2),
      netPnl: round(v.pnl),
    }))
    .sort((a, b) => b.netPnl - a.netPnl);

  const stats: JournalStats = {
    closedTrades,
    wins,
    losses,
    winRate: wins + losses > 0 ? round(wins / (wins + losses), 2) : 0,
    avgR: rCount > 0 ? round(rSum / rCount) : 0,
    netPnl: round(netPnl),
    sessions,
    setups,
  };

  // Best session edge over the next-best session (min 2 trades each).
  const eligible = sessions.filter((s) => s.trades >= 2);
  if (eligible.length >= 2) {
    const [best, second] = eligible;
    stats.bestSession = {
      session: best.session,
      avgR: best.avgR,
      edgeR: round(best.avgR - second.avgR),
      over: second.session,
    };
  }

  const eligibleSetups = setups.filter((s) => s.trades >= 2);
  if (eligibleSetups.length > 0) stats.bestSetup = eligibleSetups[0];

  return stats;
}
