import { NextRequest, NextResponse } from "next/server";
import { getActiveAccountIds } from "@/lib/account";
import { getSetupTrades, type Range } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RANGES: Range[] = ["week", "month", "ytd", "all"];

// GET /api/analytics/setup?tag=Breakout&range=month[&accountId=...]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  if (!tag) {
    return NextResponse.json({ error: "Missing tag" }, { status: 400 });
  }
  const rangeParam = searchParams.get("range") as Range | null;
  const range = rangeParam && RANGES.includes(rangeParam) ? rangeParam : "month";

  const ids = await getActiveAccountIds(searchParams.get("accountId") ?? undefined);
  if (ids.length === 0) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const data = await getSetupTrades(ids, tag, range);
  return NextResponse.json(data);
}
