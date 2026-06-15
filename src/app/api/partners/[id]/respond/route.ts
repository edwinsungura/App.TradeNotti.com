import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { respondInvite, PartnerError, type Access } from "@/lib/partners";

export const dynamic = "force-dynamic";

// POST /api/partners/:id/respond { accept, access? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    accept?: boolean;
    access?: Access;
  };
  const access: Access = body.access === "FULL" ? "FULL" : "STATS";

  try {
    await respondInvite(user.id, id, !!body.accept, access);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PartnerError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
