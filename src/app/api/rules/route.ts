import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { getRulesForAccount, createRule } from "@/lib/rules";

export const dynamic = "force-dynamic";

// GET /api/rules[?accountId=...] — the account's active trading rules.
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

// POST /api/rules { text } — add a new rule to the rulebook.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    text?: string;
    accountId?: string;
  };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const account = await getActiveAccount(body.accountId);
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const rule = await createRule(account.id, text);
  return NextResponse.json({ rule });
}
