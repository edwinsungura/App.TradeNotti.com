"use client";

import { useEffect, useRef, useState } from "react";
import type { TradeDirection, TradeGrade } from "@prisma/client";
import {
  FilterIcon,
  CalendarIcon,
  SwapIcon,
  TargetIcon,
  TagIcon,
  RulesIcon,
  ChevronIcon,
  CheckIcon,
} from "../icons";

export interface Filters {
  direction: TradeDirection | null;
  outcome: "WIN" | "LOSS" | "BE" | null;
  grade: TradeGrade | null;
  pairs: string[];
  tags: string[];
  minR: number | null;
  dateRange: "1d" | "7d" | "30d" | null;
}

export const EMPTY_FILTERS: Filters = {
  direction: null,
  outcome: null,
  grade: null,
  pairs: [],
  tags: [],
  minR: null,
  dateRange: null,
};

export function countActive(f: Filters): number {
  return (
    (f.direction ? 1 : 0) +
    (f.outcome ? 1 : 0) +
    (f.grade ? 1 : 0) +
    (f.minR != null ? 1 : 0) +
    (f.dateRange ? 1 : 0) +
    f.pairs.length +
    f.tags.length
  );
}

type Section =
  | "date"
  | "direction"
  | "outcome"
  | "grade"
  | "pair"
  | "tags"
  | "rmultiple";

const SECTIONS: { id: Section; label: string; Icon: typeof FilterIcon }[] = [
  { id: "date", label: "Date", Icon: CalendarIcon },
  { id: "direction", label: "Direction", Icon: SwapIcon },
  { id: "outcome", label: "Outcome", Icon: TargetIcon },
  { id: "grade", label: "Grade", Icon: RulesIcon },
  { id: "pair", label: "Pair", Icon: TargetIcon },
  { id: "tags", label: "Tags", Icon: TagIcon },
  { id: "rmultiple", label: "R multiple", Icon: TargetIcon },
];

function Option({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink-soft hover:bg-black/[0.04]"
    >
      {label}
      {active && <CheckIcon size={14} />}
    </button>
  );
}

export default function FilterMenu({
  filters,
  setFilters,
  options,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  options: { symbols: string[]; tags: string[] };
}) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<Section | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSection(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const active = countActive(filters);
  const toggleInArray = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
          active > 0
            ? "border-accent/40 bg-accent-bg text-accent"
            : "border-line text-ink-soft hover:bg-black/[0.03]"
        }`}
      >
        <FilterIcon size={15} />
        Filter
        {active > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {active}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5">
          <div className="kicker px-2.5 py-1.5">Filter by</div>

          {SECTIONS.map(({ id, label, Icon }) => {
            const expanded = section === id;
            return (
              <div key={id}>
                <button
                  onClick={() => setSection(expanded ? null : id)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-ink-soft hover:bg-black/[0.04]"
                >
                  <span className="text-faint">
                    <Icon size={15} />
                  </span>
                  {label}
                  <span
                    className={`ml-auto text-faint transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronIcon size={14} />
                  </span>
                </button>

                {expanded && (
                  <div className="mb-1 ml-2 border-l border-line pl-1.5">
                    {id === "date" &&
                      (
                        [
                          ["1d", "Today"],
                          ["7d", "Last 7 days"],
                          ["30d", "Last 30 days"],
                        ] as const
                      ).map(([v, lbl]) => (
                        <Option
                          key={v}
                          label={lbl}
                          active={filters.dateRange === v}
                          onClick={() =>
                            setFilters({
                              ...filters,
                              dateRange: filters.dateRange === v ? null : v,
                            })
                          }
                        />
                      ))}

                    {id === "direction" &&
                      (
                        [
                          ["LONG", "Long"],
                          ["SHORT", "Short"],
                        ] as const
                      ).map(([v, lbl]) => (
                        <Option
                          key={v}
                          label={lbl}
                          active={filters.direction === v}
                          onClick={() =>
                            setFilters({
                              ...filters,
                              direction: filters.direction === v ? null : v,
                            })
                          }
                        />
                      ))}

                    {id === "outcome" &&
                      (
                        [
                          ["WIN", "Win"],
                          ["LOSS", "Loss"],
                          ["BE", "Breakeven"],
                        ] as const
                      ).map(([v, lbl]) => (
                        <Option
                          key={v}
                          label={lbl}
                          active={filters.outcome === v}
                          onClick={() =>
                            setFilters({
                              ...filters,
                              outcome: filters.outcome === v ? null : v,
                            })
                          }
                        />
                      ))}

                    {id === "grade" &&
                      (
                        [
                          ["HIGH_PROBABILITY", "High probability"],
                          ["LOW_PROBABILITY", "Low probability"],
                        ] as const
                      ).map(([v, lbl]) => (
                        <Option
                          key={v}
                          label={lbl}
                          active={filters.grade === v}
                          onClick={() =>
                            setFilters({
                              ...filters,
                              grade: filters.grade === v ? null : v,
                            })
                          }
                        />
                      ))}

                    {id === "pair" &&
                      (options.symbols.length === 0 ? (
                        <p className="px-2.5 py-1.5 text-[12px] text-faint">
                          No pairs yet
                        </p>
                      ) : (
                        options.symbols.map((s) => (
                          <Option
                            key={s}
                            label={s}
                            active={filters.pairs.includes(s)}
                            onClick={() =>
                              setFilters({
                                ...filters,
                                pairs: toggleInArray(filters.pairs, s),
                              })
                            }
                          />
                        ))
                      ))}

                    {id === "tags" &&
                      (options.tags.length === 0 ? (
                        <p className="px-2.5 py-1.5 text-[12px] text-faint">
                          No tags yet
                        </p>
                      ) : (
                        options.tags.map((t) => (
                          <Option
                            key={t}
                            label={t}
                            active={filters.tags.includes(t)}
                            onClick={() =>
                              setFilters({
                                ...filters,
                                tags: toggleInArray(filters.tags, t),
                              })
                            }
                          />
                        ))
                      ))}

                    {id === "rmultiple" &&
                      ([1, 2, 3] as const).map((r) => (
                        <Option
                          key={r}
                          label={`≥ +${r}R`}
                          active={filters.minR === r}
                          onClick={() =>
                            setFilters({
                              ...filters,
                              minR: filters.minR === r ? null : r,
                            })
                          }
                        />
                      ))}
                  </div>
                )}
              </div>
            );
          })}

          {active > 0 && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="mt-1 w-full rounded-md px-2.5 py-2 text-left text-[13px] font-medium text-loss hover:bg-loss-soft/60"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
