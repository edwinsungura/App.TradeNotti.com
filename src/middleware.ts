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

// The public marketing / waitlist site. app.tradenotti.com is invite-only beta,
// so anyone who isn't a signed-in beta user is sent here. Lives in a separate
// Vercel project — we only ever link out to it, never serve it from this app.
const WAITLIST_URL =
  process.env.NEXT_PUBLIC_WAITLIST_URL || "https://tradenotti.com";

const withClerk = clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const { userId } = await auth();

  // Bare app domain: signed-in beta users go to their dashboard; everyone else
  // gets the public waitlist site.
  if (url.pathname === "/") {
    if (userId) return NextResponse.redirect(new URL("/today", req.url));
    return NextResponse.redirect(WAITLIST_URL);
  }

  // Protected surfaces: a signed-out visitor isn't a beta user yet, so send
  // them to the waitlist rather than a login wall. Invited users reach /login
  // and /signup directly (those routes are public) from their Clerk invitation.
  if (isProtected(req) && !userId) {
    return NextResponse.redirect(WAITLIST_URL);
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
