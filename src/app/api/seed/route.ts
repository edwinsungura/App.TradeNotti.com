import { NextRequest, NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

// One-time demo seeding endpoint. Visit in a browser with the secret:
//   /api/seed?secret=YOUR_CRON_SECRET
// or send `Authorization: Bearer YOUR_CRON_SECRET`. Requires CRON_SECRET to be
// set; without it the endpoint is disabled so it can never run unprotected.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Seeding disabled: set CRON_SECRET to enable this endpoint." },
      { status: 403 },
    );
  }

  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await seedDatabase();
    return NextResponse.json({ ok: true, seeded: summary });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "seed failed" },
      { status: 500 },
    );
  }
}
