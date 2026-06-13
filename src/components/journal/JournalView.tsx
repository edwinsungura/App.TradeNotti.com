"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { JournalRow } from "@/lib/journal";
import { formatPrice, formatMoney, formatR, formatTradeTime } from "@/lib/format";
import { DirBadge, GradePill, TagChip, signedClass } from "./cells";
import FilterMenu, {
  EMPTY_FILTERS,
  formatRFilter,
  type Filters,
} from "./FilterMenu";

const TABS = [
  { id: "ALL", label: "All" },
  { id: "LONG", label: "Long" },
  { id: "SHORT", label: "Short" },
] as const;

function withinRange(iso: string, range: Filters["dateRange"]): boolean {
  if (!range) return true;
  const days = range === "1d" ? 1 : range === "7d" ? 7 : 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= cutoff;
}

function applyFilters(rows: JournalRow[], f: Filters): JournalRow[] {
  return rows.filter((t) => {
    if (f.direction && t.direction !== f.direction) return false;
    if (f.grade && t.grade !== f.grade) return false;
    if (f.outcome) {
      const p = t.pnl ?? 0;
      if (f.outcome === "WIN" && !(p > 0)) return false;
      if (f.outcome === "LOSS" && !(p < 0)) return false;
      if (f.outcome === "BE" && p !== 0) return false;
    }
    if (f.pairs.length && !f.pairs.includes(t.symbol)) return false;
    if (f.tags.length && !f.tags.some((tag) => t.tags.includes(tag)))
      return false;
    if (f.rMultiple) {
      if (t.rMultiple == null) return false;
      const { op, value } = f.rMultiple;
      if (op === "gte" && !(t.rMultiple >= value)) return false;
      if (op === "lte" && !(t.rMultiple <= value)) return false;
    }
    if (!withinRange(t.openedAt, f.dateRange)) return false;
    return true;
  });
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-bg px-2 py-1 text-[12px] font-medium text-accent">
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="leading-none">
        ×
      </button>
    </span>
  );
}

export default function JournalView({
  trades,
  options,
}: {
  trades: JournalRow[];
  options: { symbols: string[]; tags: string[] };
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ALL");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const effective: Filters = {
    ...filters,
    direction:
      tab === "ALL" ? filters.direction : (tab as "LONG" | "SHORT"),
  };

  const rows = useMemo(
    () => applyFilters(trades, effective),
    [trades, effective],
  );

  const dateLabel = { "1d": "Today", "7d": "Last 7 days", "30d": "Last 30 days" };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <FilterMenu filters={filters} setFilters={setFilters} options={options} />
        </div>

        {/* Tabs */}
        <div className="mb-4 flex items-center gap-2 border-b border-line pb-px">
          <span className="mr-2 inline-flex items-center gap-2 text-[13px] font-medium text-ink">
            Trades
            <span className="rounded bg-accent-bg px-1.5 py-0.5 text-[11px] font-semibold text-accent">
              {rows.length}
            </span>
          </span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-black/[0.04] p-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === t.id
                    ? "bg-surface text-ink shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Active filter chips */}
          {filters.dateRange && (
            <Chip
              label={dateLabel[filters.dateRange]}
              onRemove={() => setFilters({ ...filters, dateRange: null })}
            />
          )}
          {filters.outcome && (
            <Chip
              label={
                filters.outcome === "WIN"
                  ? "Win"
                  : filters.outcome === "LOSS"
                    ? "Loss"
                    : "Breakeven"
              }
              onRemove={() => setFilters({ ...filters, outcome: null })}
            />
          )}
          {filters.grade && (
            <Chip
              label={
                filters.grade === "HIGH_PROBABILITY"
                  ? "High probability"
                  : "Low probability"
              }
              onRemove={() => setFilters({ ...filters, grade: null })}
            />
          )}
          {filters.rMultiple && (
            <Chip
              label={formatRFilter(filters.rMultiple)}
              onRemove={() => setFilters({ ...filters, rMultiple: null })}
            />
          )}
          {filters.pairs.map((p) => (
            <Chip
              key={p}
              label={p}
              onRemove={() =>
                setFilters({
                  ...filters,
                  pairs: filters.pairs.filter((x) => x !== p),
                })
              }
            />
          ))}
          {filters.tags.map((t) => (
            <Chip
              key={t}
              label={t}
              onRemove={() =>
                setFilters({
                  ...filters,
                  tags: filters.tags.filter((x) => x !== t),
                })
              }
            />
          ))}
        </div>

        <section className="rounded-2xl border border-line bg-surface px-2 py-2">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-faint">
              No trades match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="kicker border-b border-line [&>th]:px-3 [&>th]:pb-2 [&>th]:pt-2 [&>th]:font-semibold">
                    <th className="!pl-4">Pair</th>
                    <th>Dir.</th>
                    <th className="text-right">Entry</th>
                    <th className="text-right">SL</th>
                    <th className="text-right">TP</th>
                    <th className="text-right">P&amp;L</th>
                    <th className="text-right">R</th>
                    <th>Grade</th>
                    <th>Tags</th>
                    <th className="!pr-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="text-[13.5px]">
                  {rows.map((t) => (
                    <tr
                      key={t.id}
                      className="group border-b border-line/60 last:border-0"
                    >
                      <td className="!pl-0">
                        <Link
                          href={`/journal/${t.id}`}
                          className="flex items-center gap-2 rounded-l-lg px-4 py-3.5 font-medium group-hover:bg-black/[0.02]"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              (t.pnl ?? 0) >= 0 ? "bg-profit" : "bg-loss"
                            }`}
                          />
                          {t.symbol}
                        </Link>
                      </td>
                      <Cell id={t.id}>
                        <DirBadge direction={t.direction} />
                      </Cell>
                      <Cell id={t.id} className="num text-right">
                        {formatPrice(t.entry)}
                      </Cell>
                      <Cell id={t.id} className="num text-right text-ink-soft">
                        {formatPrice(t.stopLoss)}
                      </Cell>
                      <Cell id={t.id} className="num text-right text-ink-soft">
                        {formatPrice(t.takeProfit)}
                      </Cell>
                      <Cell
                        id={t.id}
                        className={`num text-right font-medium ${signedClass(t.pnl)}`}
                      >
                        {formatMoney(t.pnl)}
                      </Cell>
                      <Cell
                        id={t.id}
                        className={`num text-right ${signedClass(t.rMultiple)}`}
                      >
                        {formatR(t.rMultiple)}
                      </Cell>
                      <Cell id={t.id}>
                        <GradePill grade={t.grade} />
                      </Cell>
                      <Cell id={t.id}>
                        <span className="flex flex-wrap gap-1.5">
                          {t.tags.length === 0 ? (
                            <span className="text-faint">—</span>
                          ) : (
                            t.tags.map((tag) => <TagChip key={tag}>{tag}</TagChip>)
                          )}
                        </span>
                      </Cell>
                      <td className="!pr-0">
                        <Link
                          href={`/journal/${t.id}`}
                          className="block rounded-r-lg px-4 py-3.5 text-right text-[12px] text-muted group-hover:bg-black/[0.02]"
                        >
                          {formatTradeTime(t.openedAt)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Table cell wrapped in a link so the whole row navigates to the detail page.
function Cell({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <td className="p-0">
      <Link
        href={`/journal/${id}`}
        className={`block px-3 py-3.5 group-hover:bg-black/[0.02] ${className}`}
      >
        {children}
      </Link>
    </td>
  );
}
