import { NextRequest, NextResponse } from "next/server";
import { getActiveAccountIds } from "@/lib/account";
import { getPerformance, type Period } from "@/lib/resources";

export const dynamic = "force-dynamic";

const PERIODS: Period[] = ["weekly", "monthly", "quarterly", "yearly"];

// GET /api/resources/performance?period=monthly[&accountId=...]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const p = searchParams.get("period") as Period | null;
  const period = p && PERIODS.includes(p) ? p : "monthly";

  const ids = await getActiveAccountIds(searchParams.get("accountId") ?? undefined);
  if (ids.length === 0) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }
  return NextResponse.json(await getPerformance(ids, period));
}
