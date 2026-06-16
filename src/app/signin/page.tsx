import Link from "next/link";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-xl font-bold tracking-tight">You&apos;ve been signed out</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted">
          Sign back in to pick up your trading journal where you left off.
        </p>
        <Link
          href="/today"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
