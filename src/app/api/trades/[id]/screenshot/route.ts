import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveAccount } from "@/lib/account";
import type { ScreenshotKind } from "@prisma/client";

export const dynamic = "force-dynamic";

// Cap the stored data URL size (~4MB) so we stay within serverless body limits.
const MAX_DATA_URL = 4_000_000;

// POST /api/trades/:id/screenshot  Body: { kind: "BEFORE"|"AFTER", dataUrl }
// Upserts the before/after screenshot (one per kind per trade).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    kind?: string;
    dataUrl?: string;
  };

  const kind = body.kind?.toUpperCase();
  if (kind !== "BEFORE" && kind !== "AFTER") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (!body.dataUrl || !body.dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }
  if (body.dataUrl.length > MAX_DATA_URL) {
    return NextResponse.json(
      { error: "Image too large (max ~3MB after compression)" },
      { status: 413 },
    );
  }

  const account = await getActiveAccount();
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }
  const trade = await prisma.trade.findFirst({
    where: { id, accountId: account.id },
    select: { id: true },
  });
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }

  await prisma.screenshot.upsert({
    where: { tradeId_kind: { tradeId: id, kind: kind as ScreenshotKind } },
    create: { tradeId: id, kind: kind as ScreenshotKind, dataUrl: body.dataUrl },
    update: { dataUrl: body.dataUrl },
  });

  return NextResponse.json({ ok: true, kind });
}

// DELETE /api/trades/:id/screenshot?kind=BEFORE — remove a screenshot.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const kind = req.nextUrl.searchParams.get("kind")?.toUpperCase();
  if (kind !== "BEFORE" && kind !== "AFTER") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const account = await getActiveAccount();
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }
  await prisma.screenshot.deleteMany({
    where: { tradeId: id, kind: kind as ScreenshotKind, trade: { accountId: account.id } },
  });
  return NextResponse.json({ ok: true });
}
