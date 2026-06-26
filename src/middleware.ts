import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Every app surface requires a signed-in user.
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

// Fail closed: if Clerk isn't configured we can't authenticate, so never
// serve the app — send protected routes to /login instead of exposing them.
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const withClerk = clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  // Dashboard is the home; signed-out users get bounced to /login by protect().
  if (url.pathname === "/") {
    return NextResponse.redirect(new URL("/today", req.url));
  }
  if (isProtected(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export default function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (!CLERK_ENABLED) {
    if (isProtected(req)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
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
