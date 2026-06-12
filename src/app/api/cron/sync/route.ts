import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncAccountTrades } from "@/lib/broker-sync";

export const dynamic = "force-dynamic";

// Scheduled broker reconciliation (Vercel Cron hits this with GET).
// If CRON_SECRET is set, require a matching Bearer token (Vercel sends it).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const accounts = await prisma.account.findMany({ select: { id: true, label: true } });
  const results: { account: string; open: number; closed: number; error?: string }[] = [];

  for (const account of accounts) {
    try {
      const r = await syncAccountTrades(account.id);
      results.push({ account: account.label, ...r });
    } catch (err) {
      results.push({
        account: account.label,
        open: 0,
        closed: 0,
        error: err instanceof Error ? err.message : "sync failed",
      });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}
