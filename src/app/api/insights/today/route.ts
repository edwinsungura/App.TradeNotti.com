import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getTodayInsight } from "@/lib/ai/daily-insight";

export const dynamic = "force-dynamic";

// GET /api/insights/today[?accountId=...][&force=1]
// Returns today's cached insight, generating it once per day if absent.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? undefined;
  const force = searchParams.get("force") === "1";

  const account = await getActiveAccount(accountId);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const insight = await getTodayInsight(account.id, { force });
  return NextResponse.json(insight);
}
