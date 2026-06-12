import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getRulesForAccount } from "@/lib/rules";

export const dynamic = "force-dynamic";

// GET /api/rules[?accountId=...]
// Read-only feed of the account's active trading rules (managed later in the
// Rules feature).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? undefined;

  const account = await getActiveAccount(accountId);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const rules = await getRulesForAccount(account.id);
  return NextResponse.json({ accountId: account.id, rules });
}
