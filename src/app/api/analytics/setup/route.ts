import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
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

  const account = await getActiveAccount(searchParams.get("accountId") ?? undefined);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const data = await getSetupTrades(account.id, tag, range);
  return NextResponse.json(data);
}
