import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { removePartnership, updateMyAccess, type Access } from "@/lib/partners";

export const dynamic = "force-dynamic";

// PATCH /api/partners/:id { access } — change what I share with this partner.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { access?: Access };
  const access: Access = body.access === "FULL" ? "FULL" : "STATS";
  await updateMyAccess(user.id, id, access);
  return NextResponse.json({ ok: true });
}

// DELETE /api/partners/:id — remove a partner or cancel an invite.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  await removePartnership(user.id, id);
  return NextResponse.json({ ok: true });
}
