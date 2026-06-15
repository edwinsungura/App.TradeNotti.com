import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { listDocs, createDoc } from "@/lib/resources";

export const dynamic = "force-dynamic";

// GET /api/resources — the user's documents.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  return NextResponse.json({ docs: await listDocs(user.id) });
}

// POST /api/resources { title? } — create a new document.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const doc = await createDoc(user.id, body.title?.trim() || "Untitled");
  return NextResponse.json({ doc });
}
