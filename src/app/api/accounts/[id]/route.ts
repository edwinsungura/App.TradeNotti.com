import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import {
  updateAccount,
  deleteAccount,
  SettingsError,
  type AccountInput,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

// PATCH /api/accounts/:id — edit / archive / unarchive an account.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as AccountInput;
  try {
    const account = await updateAccount(user.id, id, body);
    if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ account });
  } catch (e) {
    if (e instanceof SettingsError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

// DELETE /api/accounts/:id — permanently remove an account and its trades.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  await deleteAccount(user.id, id);
  return NextResponse.json({ ok: true });
}
