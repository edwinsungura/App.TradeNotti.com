import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { listNotifications, unreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// GET /api/notifications — recent notifications + unread count.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });
  const [notifications, unread] = await Promise.all([
    listNotifications(user.id),
    unreadCount(user.id),
  ]);
  return NextResponse.json({ notifications, unread });
}
