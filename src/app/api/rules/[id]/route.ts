import { NextRequest, NextResponse } from "next/server";
import { getActiveAccount } from "@/lib/account";
import { updateRule, deleteRule } from "@/lib/rules";

export const dynamic = "force-dynamic";

// PATCH /api/rules/:id { text } — edit a rule.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { text?: string };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }
  const account = await getActiveAccount();
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }
  const rule = await updateRule(account.id, id, text);
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ rule });
}

// DELETE /api/rules/:id — remove a rule.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const account = await getActiveAccount();
  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }
  await deleteRule(account.id, id);
  return NextResponse.json({ ok: true });
}
