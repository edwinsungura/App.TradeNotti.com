import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { listPins, createPin, type PinInput } from "@/lib/pinboard";

export const dynamic = "force-dynamic";

// GET /api/pinboard — the user's pins.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  return NextResponse.json({ pins: await listPins(user.id) });
}

// POST /api/pinboard — create a pin from an uploaded chart screenshot.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as PinInput;
  try {
    const pin = await createPin(user.id, body);
    return NextResponse.json({ pin });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not save pin." },
      { status: 400 },
    );
  }
}
