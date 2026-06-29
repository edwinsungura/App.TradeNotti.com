import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { cycleEntry, VALID_DATE } from "@/lib/habits";

export const dynamic = "force-dynamic";

// POST /api/habits/[id]/toggle { date: "YYYY-MM-DD" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as { date?: string };
  if (!body.date || !VALID_DATE.test(body.date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const result = await cycleEntry(user.id, id, body.date);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}
