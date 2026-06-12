import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { syncAccountTrades } from "@/lib/broker-sync";

export const dynamic = "force-dynamic";

// POST /api/sync[?accountId=...] — reconcile open positions from the broker.
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? undefined;

  const account = await getActiveAccount(accountId);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
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
