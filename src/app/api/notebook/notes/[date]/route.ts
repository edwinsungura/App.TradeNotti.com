import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { getNote, upsertNote, deleteNote, isValidDate } from "@/lib/notebook";

export const dynamic = "force-dynamic";

// GET /api/notebook/notes/:date  — the note for a day (or null).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  if (!isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const note = await getNote(user.id, date);
  return NextResponse.json({ note });
}

// PUT /api/notebook/notes/:date  — save title/content for a day.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  if (!isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    content?: unknown;
  };

  const note = await upsertNote(user.id, date, {
    title: body.title,
    content: body.content as never,
  });
  return NextResponse.json({ note });
}

// DELETE /api/notebook/notes/:date — remove a day's page.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  if (!isValidDate(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  await deleteNote(user.id, date);
  return NextResponse.json({ ok: true });
}
