import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { sendInvite, PartnerError, type Access } from "@/lib/partners";

export const dynamic = "force-dynamic";

// POST /api/partners/invite { username, access }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    access?: Access;
  };
  if (!body.username?.trim()) {
    return NextResponse.json({ error: "Enter a username." }, { status: 400 });
  }
  const access: Access = body.access === "FULL" ? "FULL" : "STATS";

  try {
    await sendInvite(user.id, body.username, access);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PartnerError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
