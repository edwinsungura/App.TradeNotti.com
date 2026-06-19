import Link from "next/link";
import Logo from "@/components/Logo";
import {
  JournalIcon,
  AnalyticsIcon,
  NotebookIcon,
  PartnersIcon,
} from "@/components/icons";

export const dynamic = "force-static";

const FEATURES = [
  {
    Icon: JournalIcon,
    title: "Auto-synced journal",
    body: "Connect MT4/MT5 and your trades import themselves — grade, tag, and review.",
  },
  {
    Icon: AnalyticsIcon,
    title: "Analytics that find your edge",
    body: "Win rate, R, equity curve, best & worst setups, and a performance calendar.",
  },
  {
    Icon: NotebookIcon,
    title: "AI voice journaling",
    body: "Speak your thoughts; they're transcribed and saved to the trade in seconds.",
  },
  {
    Icon: PartnersIcon,
    title: "Accountability partners",
    body: "Share your stats with a trusted trader and keep each other honest.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/today" className="text-[14px] font-medium text-ink-soft hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/today"
            className="rounded-lg bg-accent px-4 py-2 text-[13.5px] font-medium text-white hover:bg-accent/90"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-5 pt-16 text-center sm:pt-24">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-accent-bg px-3 py-1 text-[12.5px] font-medium text-accent">
          AI voice journaling for traders
        </span>
        <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          Voice-journal your trades in seconds.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-[17px]">
          Most traders quit journaling because it&apos;s tedious. Just talk — TradeNotti
          transcribes it, syncs your trades automatically, and shows you what&apos;s
          actually working.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/today"
            className="rounded-xl bg-accent px-6 py-3 text-[15px] font-semibold text-white hover:bg-accent/90"
          >
            Start your free trial
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-line px-6 py-3 text-[15px] font-medium text-ink-soft hover:bg-black/[0.03]"
          >
            See how it works
          </a>
        </div>
        <p className="mt-4 text-[12.5px] text-faint">
          Connect MetaTrader · No credit card to start
        </p>
      </main>

      {/* Features */}
      <section id="features" className="mx-auto w-full max-w-5xl px-5 py-20 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-6">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-bg text-accent">
                <Icon size={20} />
              </span>
              <h3 className="text-[16px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl border-t border-line px-5 py-8 text-[12.5px] text-faint sm:px-8">
        © {new Date().getFullYear()} TradeNotti · Trade journaling &amp; reviewing made simple
      </footer>
    </div>
  );
}
