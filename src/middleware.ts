import { NextRequest, NextResponse } from "next/server";

// Only the apex marketing domain shows the landing page at "/".
const APEX_HOSTS = new Set(["tradenotti.com", "www.tradenotti.com"]);

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];

  // On the app subdomain (and localhost / Vercel previews) the root goes
  // straight into the app. On the apex domain it falls through to the landing.
  if (!APEX_HOSTS.has(host)) {
    return NextResponse.redirect(new URL("/today", req.url));
  }
  return NextResponse.next();
}

// Run only on the root path.
export const config = { matcher: ["/"] };
