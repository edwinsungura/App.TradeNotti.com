import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { listTemplates, createTemplate } from "@/lib/notebook";

export const dynamic = "force-dynamic";

// GET /api/notebook/templates  — the user's saved templates.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  return NextResponse.json({ templates: await listTemplates(user.id) });
}

// POST /api/notebook/templates  — save a new template { name, content }.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    content?: unknown;
  };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const template = await createTemplate(user.id, name, body.content as never);
  return NextResponse.json({ template });
}
