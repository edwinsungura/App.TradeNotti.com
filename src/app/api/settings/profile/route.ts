import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { updateProfile, SettingsError, type ProfileInput } from "@/lib/settings";

export const dynamic = "force-dynamic";

// PATCH /api/settings/profile { name?, email?, avatarUrl? }
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as ProfileInput;
  try {
    const profile = await updateProfile(user.id, body);
    return NextResponse.json({ profile });
  } catch (e) {
    if (e instanceof SettingsError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
