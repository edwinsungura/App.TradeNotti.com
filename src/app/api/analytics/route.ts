import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getAnalytics, type Range } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RANGES: Range[] = ["week", "month", "ytd", "all", "custom"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/analytics?range=month  OR  ?range=custom&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rangeParam = searchParams.get("range") as Range | null;
  let range: Range = rangeParam && RANGES.includes(rangeParam) ? rangeParam : "month";

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  let custom: { from: string; to: string } | undefined;
  if (range === "custom") {
    if (!from || !to || !DATE.test(from) || !DATE.test(to)) {
      return NextResponse.json({ error: "Invalid custom range" }, { status: 400 });
    }
    custom = from <= to ? { from, to } : { from: to, to: from };
  }

  const account = await getActiveAccount(searchParams.get("accountId") ?? undefined);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const data = await getAnalytics(account.id, range, custom);
  return NextResponse.json(data);
}
