import Link from "next/link";
import { CheckIcon, ArrowRightIcon } from "../icons";
import type { RuleView } from "@/lib/rules";

// Read-only view of the trader's rules (authored in the Rules feature).
export default function TradingRules({ rules }: { rules: RuleView[] }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Trading rules</h2>
        <Link
          href="/rules"
          className="flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
        >
          Edit rules <ArrowRightIcon size={14} />
        </Link>
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-faint">
          No rules yet. Add your trading rules to see them here.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-3 rounded-xl bg-black/[0.02] px-4 py-3"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-profit-soft text-profit">
                <CheckIcon size={13} />
              </span>
              <span className="text-[13.5px] text-ink-soft">{rule.text}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
