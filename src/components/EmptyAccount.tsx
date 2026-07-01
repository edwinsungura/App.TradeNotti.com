import Link from "next/link";
import { TrendingUpIcon, ArrowRightIcon } from "./icons";

/**
 * Friendly first-run empty state shown when a signed-in user has no trading
 * account connected yet. Replaces the old "No account found. Run the seed to
 * get started." developer message with a customer-facing onboarding prompt.
 */
export default function EmptyAccount({
  title = "Let's set up your first account",
  subtitle = "Connect a trading account to start journaling your trades, tracking performance, and building better habits.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-bg text-accent">
          <TrendingUpIcon size={26} />
        </div>
        <h1 className="mb-2 text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        <p className="mb-7 text-sm leading-relaxed text-muted">{subtitle}</p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-accent to-[#9d7bff] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Add trading account
          <ArrowRightIcon size={15} />
        </Link>
        <p className="mt-4 text-xs text-faint">
          Takes about 30 seconds with your broker&apos;s read-only investor
          password.
        </p>
      </div>
    </div>
  );
}
