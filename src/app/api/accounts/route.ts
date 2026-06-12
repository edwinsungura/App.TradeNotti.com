import { NextResponse } from "next/server";
import { getAccountsForCurrentUser } from "@/lib/account";

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
