import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Server-side gate (defense in depth alongside the middleware). Any layout/page
 * that calls this redirects signed-out visitors to /login. No-op when Clerk
 * isn't configured so local builds still work.
 */
export async function requireUser() {
  if (!CLERK_ENABLED) return;
  const user = await currentUser();
  if (!user) redirect("/login");
}
