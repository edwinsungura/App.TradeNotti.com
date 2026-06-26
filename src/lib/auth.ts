import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Server-side gate (defense in depth alongside the middleware). Any layout/page
 * that calls this redirects signed-out visitors to the in-app /login (same
 * host, so it can never loop). Beta access is enforced by Clerk "Restricted"
 * mode. No-op when Clerk isn't configured so local demo builds still work.
 */
export async function requireUser() {
  if (!CLERK_ENABLED) return;
  const user = await currentUser();
  if (!user) redirect("/login");
}
