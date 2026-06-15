import { NextRequest, NextResponse } from "next/server";
import { getAccountsForCurrentUser, getCurrentUser } from "@/lib/account";
import { createAccount, SettingsError, type AccountInput } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await getAccountsForCurrentUser();
  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      label: a.label,
      broker: a.broker,
      currency: a.currency,
      type: a.type,
    })),
  });
}

// POST /api/accounts — add a trading account.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as AccountInput;
  try {
    const account = await createAccount(user.id, body);
    return NextResponse.json({ account });
  } catch (e) {
    if (e instanceof SettingsError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
