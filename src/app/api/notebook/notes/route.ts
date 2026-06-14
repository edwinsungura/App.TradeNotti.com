import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { getMonthNotes } from "@/lib/notebook";

export const dynamic = "force-dynamic";

// GET /api/notebook/notes?month=YYYY-MM  — notes (date + title) in that month.
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
