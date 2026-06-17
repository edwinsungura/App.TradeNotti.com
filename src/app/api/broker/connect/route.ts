import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/account";
import { connectAccountBroker } from "@/lib/broker-connect";

export const dynamic = "force-dynamic";

// POST /api/broker/connect { accountId, login, password, server, platform? }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    accountId?: string;
    login?: string;
    password?: string;
    server?: string;
    platform?: "mt4" | "mt5";
  };

  if (!body.accountId || !body.login?.trim() || !body.server?.trim() || !body.password) {
    return NextResponse.json(
      { error: "Login, server and investor password are required." },
      { status: 400 },
    );
  }

  const account = await prisma.account.findFirst({
    where: { id: body.accountId, userId: user.id },
    select: { id: true },
  });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  try {
    await connectAccountBroker(account.id, {
      login: body.login.trim(),
      password: body.password,
      server: body.server.trim(),
      platform: body.platform,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not connect broker." },
      { status: 502 },
    );
  }
}
