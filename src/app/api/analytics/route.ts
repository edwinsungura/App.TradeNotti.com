import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getAnalytics, type Range } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RANGES: Range[] = ["week", "month", "ytd", "all"];

// GET /api/analytics?range=month[&accountId=...]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range") as Range | null;
  const range = rangeParam && RANGES.includes(rangeParam) ? rangeParam : "month";

  const account = await getActiveAccount(searchParams.get("accountId") ?? undefined);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const data = await getAnalytics(account.id, range);
  return NextResponse.json(data);
}
