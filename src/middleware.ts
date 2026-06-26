import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Every app surface requires a signed-in (invited beta) user.
const isProtected = createRouteMatcher([
  "/today(.*)",
  "/journal(.*)",
  "/analytics(.*)",
  "/notebook(.*)",
  "/rules(.*)",
  "/resources(.*)",
  "/settings(.*)",
  "/partners(.*)",
  "/pinboard(.*)",
]);

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const withClerk = clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  // Dashboard is the home for signed-in beta users.
  if (url.pathname === "/") {
    return NextResponse.redirect(new URL("/today", req.url));
  }
  // Signed-out visitors are sent to the in-app /login (same host, so it can
  // never loop). Beta access itself is enforced by Clerk "Restricted" mode:
  // only invited emails can create an account, so /login is a dead end for
  // anyone who hasn't been invited.
  if (isProtected(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  // Local/demo (no Clerk configured): serve the app with demo data, no gate.
  if (!CLERK_ENABLED) {
    return NextResponse.next();
  }
  return withClerk(req, ev);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
