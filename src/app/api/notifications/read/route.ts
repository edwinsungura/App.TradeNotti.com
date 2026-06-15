import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { markRead, markAllRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// POST /api/notifications/read { id? } — mark one read, or all when id omitted.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { id?: string };
  if (body.id) await markRead(user.id, body.id);
  else await markAllRead(user.id);
  return NextResponse.json({ ok: true });
}
