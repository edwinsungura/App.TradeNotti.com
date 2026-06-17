import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { syncAccountTrades } from "@/lib/broker-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Minimum gap between manual syncs (cost control — avoids deploy churn).
const COOLDOWN_MS = 60_000;

// POST /api/sync[?accountId=...] — on-demand broker sync for one account.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? undefined;

  const account = await getActiveAccount(accountId);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  if (account.syncStatus === "syncing") {
    return NextResponse.json({ error: "Sync already in progress." }, { status: 409 });
  }
  if (
    account.lastSyncedAt &&
    Date.now() - account.lastSyncedAt.getTime() < COOLDOWN_MS
  ) {
    const wait = Math.ceil(
      (COOLDOWN_MS - (Date.now() - account.lastSyncedAt.getTime())) / 1000,
    );
    return NextResponse.json(
      { error: `Just synced — try again in ${wait}s.` },
      { status: 429 },
    );
  }

  try {
    const result = await syncAccountTrades(account.id);
    return NextResponse.json({ accountId: account.id, ...result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 502 },
    );
  }
}
