import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { createHabit, getHabitGrid } from "@/lib/habits";

export const dynamic = "force-dynamic";

// GET /api/habits?year=2026&month=5  (month 0-11) — grid + streaks for a month
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = Number(searchParams.get("year")) || now.getUTCFullYear();
  const monthRaw = searchParams.get("month");
  const month = monthRaw != null ? Number(monthRaw) : now.getUTCMonth();
  if (!Number.isInteger(month) || month < 0 || month > 11) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }
  return NextResponse.json(await getHabitGrid(user.id, year, month));
}

// POST /api/habits { name, emoji?, color? }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    emoji?: string;
    color?: string;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const habit = await createHabit(user.id, {
    name: body.name,
    emoji: body.emoji,
    color: body.color,
  });
  return NextResponse.json({ habit });
}
