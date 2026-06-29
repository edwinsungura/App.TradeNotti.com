import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { deleteHabit, updateHabit } from "@/lib/habits";

export const dynamic = "force-dynamic";

// PATCH /api/habits/[id] { name?, emoji?, color?, order?, archived? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const { id } = await params;

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    emoji?: string;
    color?: string;
    order?: number;
    archived?: boolean;
  };
  const habit = await updateHabit(user.id, id, body);
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ habit });
}

// DELETE /api/habits/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const { id } = await params;

  const ok = await deleteHabit(user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
