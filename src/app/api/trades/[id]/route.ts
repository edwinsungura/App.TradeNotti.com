import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveAccount } from "@/lib/account";
import { getTradeDetail } from "@/lib/journal";
import type { TradeGrade } from "@prisma/client";

export const dynamic = "force-dynamic";

async function resolveTrade(id: string, accountIdParam?: string) {
  const account = await getActiveAccount(accountIdParam);
  if (!account) return null;
  const trade = await prisma.trade.findFirst({
    where: { id, accountId: account.id },
    select: { id: true, accountId: true },
  });
  return trade ? { account, trade } : null;
}

// GET /api/trades/:id — full journal detail for one trade.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const account = await getActiveAccount(
    req.nextUrl.searchParams.get("accountId") ?? undefined,
  );
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }
  const detail = await getTradeDetail(account.id, id);
  if (!detail) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }
  return NextResponse.json({ trade: detail });
}

// PATCH /api/trades/:id — update manually-journaled fields.
// Body: { notes?, marketDirection?, phaseOfMarket?, grade?, tags?: string[] }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    notes?: string | null;
    marketDirection?: string | null;
    phaseOfMarket?: string | null;
    stopLossNote?: string | null;
    grade?: TradeGrade | null;
    tags?: string[];
  };

  const resolved = await resolveTrade(id);
  if (!resolved) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.marketDirection !== undefined)
    data.marketDirection = body.marketDirection;
  if (body.phaseOfMarket !== undefined) data.phaseOfMarket = body.phaseOfMarket;
  if (body.stopLossNote !== undefined) data.stopLossNote = body.stopLossNote;
  if (body.grade !== undefined) data.grade = body.grade;

  if (Object.keys(data).length > 0) {
    await prisma.trade.update({ where: { id }, data });
  }

  // Replace the tag set when provided.
  if (Array.isArray(body.tags)) {
    const names = [...new Set(body.tags.map((t) => t.trim()).filter(Boolean))];
    const tagIds: string[] = [];
    for (const name of names) {
      const tag = await prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      tagIds.push(tag.id);
    }
    await prisma.tagsOnTrades.deleteMany({ where: { tradeId: id } });
    if (tagIds.length > 0) {
      await prisma.tagsOnTrades.createMany({
        data: tagIds.map((tagId) => ({ tradeId: id, tagId })),
        skipDuplicates: true,
      });
    }
  }

  const detail = await getTradeDetail(resolved.account.id, id);
  return NextResponse.json({ trade: detail });
}
