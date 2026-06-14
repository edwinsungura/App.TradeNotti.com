import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { getMonthNotes, createNote, isValidDate } from "@/lib/notebook";

export const dynamic = "force-dynamic";

// GET /api/notebook/notes?month=YYYY-MM  — notes (id + date + title) in that month.
export async function GET(req: NextRequest) {
  const ym = req.nextUrl.searchParams.get("month");
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const notes = await getMonthNotes(user.id, ym);
  return NextResponse.json({ notes });
}

// POST /api/notebook/notes  { date, title?, content? }  — create a new page.
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    date?: string;
    title?: string;
    content?: unknown;
  };
  if (!body.date || !isValidDate(body.date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const note = await createNote(user.id, body.date, {
    title: body.title,
    content: body.content as never,
  });
  return NextResponse.json({ note });
}
