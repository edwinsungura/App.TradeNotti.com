"use client";

import { useState } from "react";
import type { CalendarData } from "@/lib/analytics";
import { ChevronIcon } from "../icons";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function compactMoney(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function PerformanceCalendar({
  initial,
  accountId,
}: {
  initial: CalendarData;
  accountId: string;
}) {
  const [data, setData] = useState<CalendarData>(initial);
  const [loading, setLoading] = useState(false);

  // Strongest move in the month sets the colour intensity scale.
  const maxAbs = Math.max(
    1,
    ...data.weeks.flat().filter((d) => d.inMonth).map((d) => Math.abs(d.pnl)),
  );

  const go = async (delta: number) => {
    let year = data.year;
    let month = data.month + delta;
    if (month < 0) {
      month = 11;
      year--;
    } else if (month > 11) {
      month = 0;
      year++;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/calendar?year=${year}&month=${month}&accountId=${accountId}`,
        { cache: "no-store" },
      );
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const cellStyle = (pnl: number) => {
    if (pnl === 0) return undefined;
    const intensity = 0.12 + 0.55 * Math.min(1, Math.abs(pnl) / maxAbs);
    const rgb = pnl > 0 ? "22,163,74" : "239,68,68";
    return { backgroundColor: `rgba(${rgb},${intensity.toFixed(2)})` };
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="kicker mb-1">{data.label}</div>
          <h2 className="text-[15px] font-semibold">Performance calendar</h2>
        </div>
        <div className={`flex items-center gap-1 ${loading ? "opacity-50" : ""}`}>
          <button
            onClick={() => go(-1)}
            disabled={loading}
            aria-label="Previous month"
            className="flex h-8 w-8 rotate-90 items-center justify-center rounded-lg text-muted hover:bg-black/[0.04]"
          >
            <ChevronIcon size={16} />
          </button>
          <button
            onClick={() => go(1)}
            disabled={loading}
            aria-label="Next month"
            className="flex h-8 w-8 -rotate-90 items-center justify-center rounded-lg text-muted hover:bg-black/[0.04]"
          >
            <ChevronIcon size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="mb-1.5 grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="kicker px-1">
                {d}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            {data.weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((cell) => (
                  <div
                    key={cell.date}
                    style={cellStyle(cell.inMonth ? cell.pnl : 0)}
                    className={`flex min-h-[84px] flex-col rounded-lg border p-2 ${
                      cell.inMonth ? "border-line/70" : "border-transparent opacity-40"
                    } ${cell.isToday ? "ring-2 ring-accent/50" : ""}`}
                  >
                    <span
                      className={`text-[12px] ${
                        cell.isToday ? "font-bold text-accent" : "text-muted"
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.inMonth && cell.trades > 0 && (
                      <span className="mt-auto">
                        <span
                          className={`block text-[13px] font-semibold ${
                            cell.pnl >= 0 ? "text-profit" : "text-loss"
                          }`}
                        >
                          {compactMoney(cell.pnl)}
                        </span>
                        <span className="block text-[10.5px] text-faint">
                          {cell.trades} {cell.trades === 1 ? "trade" : "trades"}
                        </span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: "rgba(22,163,74,0.5)" }} />
          Profit day · darker = larger move
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: "rgba(239,68,68,0.5)" }} />
          Loss day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-accent/50" />
          Today
        </span>
      </div>
    </section>
  );
}
