import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { deleteTemplate } from "@/lib/notebook";

export const dynamic = "force-dynamic";

// DELETE /api/notebook/templates/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  await deleteTemplate(user.id, id);
  return NextResponse.json({ ok: true });
}
