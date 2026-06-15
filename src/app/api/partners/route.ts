import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { getPartnersData } from "@/lib/partners";

export const dynamic = "force-dynamic";

// GET /api/partners — partners, incoming and outgoing invites.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  return NextResponse.json(await getPartnersData(user.id));
}
