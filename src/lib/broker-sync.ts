import { prisma } from "./db";
import { getBrokerProvider, type BrokerPosition } from "./broker";
import type { TradeDirection } from "@prisma/client";

// Planned reward-to-risk for an open position, signed in the trade's favor.
function plannedR(p: BrokerPosition): number | null {
  if (p.stopLoss == null || p.takeProfit == null) return null;
  const risk = Math.abs(p.entry - p.stopLoss);
  if (risk === 0) return null;
  const reward = Math.abs(p.takeProfit - p.entry);
  return Math.round((reward / risk) * 100) / 100;
}

/**
 * Pulls open positions from the account's broker and reconciles them into the
 * Trade table: open positions are upserted, and previously-synced open trades
 * that are no longer reported by the broker are marked CLOSED.
 *
 * Only broker-sourced trades (externalId set) are reconciled — manually logged
 * trades (externalId null) are never touched.
 */
export async function syncAccountTrades(accountId: string): Promise<{
  open: number;
  closed: number;
}> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new Error(`Account not found: ${accountId}`);

  const provider = getBrokerProvider({
    metaApiAccountId: account.metaApiAccountId,
    brokerLogin: account.brokerLogin,
    brokerServer: account.brokerServer,
  });

  const positions = await provider.getOpenPositions();
  const seenIds = new Set(positions.map((p) => p.externalId));

  for (const p of positions) {
    const direction: TradeDirection = p.direction;
    await prisma.trade.upsert({
      where: {
        accountId_externalId: { accountId, externalId: p.externalId },
      },
      create: {
        accountId,
        externalId: p.externalId,
        symbol: p.symbol,
        direction,
        status: "OPEN",
        entry: p.entry,
        stopLoss: p.stopLoss,
        takeProfit: p.takeProfit,
        volume: p.volume,
        pnl: p.pnl,
        rMultiple: plannedR(p),
        openedAt: p.openedAt,
      },
      update: {
        // Refresh the live fields each sync.
        pnl: p.pnl,
        stopLoss: p.stopLoss,
        takeProfit: p.takeProfit,
        status: "OPEN",
      },
    });
  }

  // Close broker-sourced trades that are no longer open at the broker.
  const staleOpen = await prisma.trade.findMany({
    where: { accountId, status: "OPEN", externalId: { not: null } },
    select: { id: true, externalId: true },
  });
  const toClose = staleOpen.filter(
    (t) => t.externalId && !seenIds.has(t.externalId),
  );
  if (toClose.length > 0) {
    await prisma.trade.updateMany({
      where: { id: { in: toClose.map((t) => t.id) } },
      data: { status: "CLOSED", closedAt: new Date() },
    });
  }

  return { open: positions.length, closed: toClose.length };
}
