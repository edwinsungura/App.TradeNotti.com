import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { updatePin, deletePin, type PinInput } from "@/lib/pinboard";

export const dynamic = "force-dynamic";

// PUT /api/pinboard/:id — edit a pin's metadata.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as PinInput;
  const pin = await updatePin(user.id, id, body);
  if (!pin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ pin });
}

// DELETE /api/pinboard/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  await deletePin(user.id, id);
  return NextResponse.json({ ok: true });
}
