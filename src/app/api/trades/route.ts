import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getOpenTrades } from "@/lib/trades";
import { syncAccountTrades } from "@/lib/broker-sync";

export const dynamic = "force-dynamic";

// GET /api/trades?status=open[&accountId=...][&sync=1]
// Returns currently running (open) trades. Pass sync=1 to refresh from the
// broker before reading.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? undefined;
  const shouldSync = searchParams.get("sync") === "1";

  const account = await getActiveAccount(accountId);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  if (shouldSync) {
    try {
      await syncAccountTrades(account.id);
    } catch (err) {
      // Don't fail the request if the broker is unreachable; serve last-known.
      console.error("[trades] sync failed:", err);
    }
  }

  const trades = await getOpenTrades(account.id);
  return NextResponse.json({ accountId: account.id, trades });
}
