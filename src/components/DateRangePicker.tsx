"use client";

import { useState } from "react";
import { ChevronIcon } from "./icons";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Compact single-month range picker. Click a start day, then an end day.
export default function DateRangePicker({
  from,
  to,
  onApply,
  onClear,
}: {
  from: string | null;
  to: string | null;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
}) {
  const init = from ? new Date(`${from}T00:00:00`) : new Date();
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [a, setA] = useState<string | null>(from);
  const [b, setB] = useState<string | null>(to);

  const pick = (key: string) => {
    if (!a || (a && b)) {
      setA(key);
      setB(null);
    } else if (key < a) {
      setB(a);
      setA(key);
    } else {
      setB(key);
    }
  };

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setMonth(m);
    setYear(y);
  };

  const startDow = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const label = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-[252px] p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <button
          onClick={() => shift(-1)}
          aria-label="Previous month"
          className="flex h-7 w-7 rotate-90 items-center justify-center rounded-md text-muted hover:bg-white/[0.05]"
        >
          <ChevronIcon size={15} />
        </button>
        <span className="text-[13px] font-semibold">{label}</span>
        <button
          onClick={() => shift(1)}
          aria-label="Next month"
          className="flex h-7 w-7 -rotate-90 items-center justify-center rounded-md text-muted hover:bg-white/[0.05]"
        >
          <ChevronIcon size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1 text-[10px] font-semibold text-faint">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d == null) return <span key={i} />;
          const key = ymd(year, month, d);
          const isEnd = key === a || key === b;
          const inRange = !!(a && b && key >= a && key <= b);
          return (
            <button
              key={i}
              onClick={() => pick(key)}
              className={`flex h-8 items-center justify-center rounded-md text-[12.5px] transition-colors ${
                isEnd
                  ? "bg-accent font-semibold text-white"
                  : inRange
                    ? "bg-accent-bg text-accent"
                    : "text-ink-soft hover:bg-white/[0.05]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <button
          onClick={onClear}
          className="rounded-md px-2 py-1 text-[12px] font-medium text-muted hover:text-loss"
        >
          Clear
        </button>
        <button
          disabled={!a || !b}
          onClick={() => a && b && onApply(a, b)}
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent/90 disabled:opacity-40"
        >
          Apply range
        </button>
      </div>
    </div>
  );
}
