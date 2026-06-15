import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getPerformance, type Period } from "@/lib/resources";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["weekly", "monthly", "quarterly", "yearly"];

// GET /api/resources/performance?period=monthly[&accountId=...]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get("period") as Period | null;
  const period = p && PERIODS.includes(p) ? p : "monthly";

  const account = await getActiveAccount(searchParams.get("accountId") ?? undefined);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }
  return NextResponse.json(await getPerformance(account.id, period));
}
