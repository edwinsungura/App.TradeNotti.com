import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getCalendar } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// GET /api/analytics/calendar?year=2026&month=4[&accountId=...]  (month is 0-11)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const monthRaw = searchParams.get("month");
  const month = monthRaw != null ? Number(monthRaw) : now.getUTCMonth();

  if (!Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const account = await getActiveAccount(searchParams.get("accountId") ?? undefined);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const data = await getCalendar(account.id, year, month);
  return NextResponse.json(data);
}
