import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getDayTrades } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// GET /api/analytics/day?date=2026-05-18[&accountId=...]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const account = await getActiveAccount(searchParams.get("accountId") ?? undefined);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const data = await getDayTrades(account.id, date);
  return NextResponse.json(data);
}
