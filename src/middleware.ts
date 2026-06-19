import { NextRequest, NextResponse } from "next/server";

// Marketing apex domains — these only ever serve the landing page.
const APEX_HOSTS = new Set(["tradenotti.com", "www.tradenotti.com"]);
// Where the actual app lives.
const APP_HOST = "app.tradenotti.com";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase().split(":")[0];
  const { pathname } = req.nextUrl;

  if (APEX_HOSTS.has(host)) {
    // Apex shows the landing page at "/"; anything else is an app route and is
    // sent to the app subdomain (path + query preserved).
    if (pathname === "/") return NextResponse.next();
    const url = req.nextUrl.clone();
    url.host = APP_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url);
  }

  // App subdomain / localhost / previews: root goes straight into the app.
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/today", req.url));
  }
  return NextResponse.next();
}

// Run on everything except Next assets, the icon, and static files (so the
// landing page can still load its CSS/JS/icon on the apex domain).
export const config = {
  matcher: ["/((?!_next/static|_next/image|icon|favicon.ico|.*\\..*).*)"],
};
