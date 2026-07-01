"use client";

import { useState } from "react";
import type { CalendarData, CalendarDay, DayTrade } from "@/lib/analytics";
import { ChevronIcon } from "../icons";
import DayTradesModal from "./DayTradesModal";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Match the Edge card P&L colours exactly (--color-profit / --color-loss).
const PROFIT_RGB = "13,157,102"; // #0d9d66
const LOSS_RGB = "226,59,59"; // #e23b3b

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

  // Day-detail modal state.
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [dayTrades, setDayTrades] = useState<DayTrade[]>([]);
  const [dayTotal, setDayTotal] = useState(0);
  const [dayLoading, setDayLoading] = useState(false);

  const openDay = async (cell: CalendarDay) => {
    if (!cell.inMonth || cell.trades === 0) return;
    setOpenDate(cell.date);
    setDayLoading(true);
    setDayTrades([]);
    try {
      const res = await fetch(
        `/api/analytics/day?date=${cell.date}&accountId=${accountId}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const json = await res.json();
        setDayTrades(json.trades);
        setDayTotal(json.totalPnl);
      }
    } finally {
      setDayLoading(false);
    }
  };

  const dayLabel = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

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

  // Flat fill: one bright green for any profit day, one bright red for any loss day.
  const cellFill = (pnl: number) => {
    if (pnl === 0) return { style: undefined, colored: false };
    const rgb = pnl > 0 ? PROFIT_RGB : LOSS_RGB;
    return { style: { backgroundColor: `rgb(${rgb})` }, colored: true };
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
            className="flex h-8 w-8 rotate-90 items-center justify-center rounded-lg text-muted hover:bg-white/[0.04]"
          >
            <ChevronIcon size={16} />
          </button>
          <button
            onClick={() => go(1)}
            disabled={loading}
            aria-label="Next month"
            className="flex h-8 w-8 -rotate-90 items-center justify-center rounded-lg text-muted hover:bg-white/[0.04]"
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
                {week.map((cell) => {
                  const fill = cellFill(cell.inMonth ? cell.pnl : 0);
                  const clickable = cell.inMonth && cell.trades > 0;
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => openDay(cell)}
                      disabled={!clickable}
                      style={fill.style}
                      className={`flex min-h-[84px] flex-col rounded-lg border p-2 text-left transition-shadow ${
                        cell.inMonth ? "border-line/70" : "border-transparent opacity-40"
                      } ${cell.isToday ? "ring-2 ring-accent/50" : ""} ${
                        clickable
                          ? "cursor-pointer hover:shadow-md hover:ring-1 hover:ring-ink/20"
                          : "cursor-default"
                      }`}
                    >
                      <span
                        className={`text-[12px] ${
                          cell.isToday && !fill.colored
                            ? "font-bold text-accent"
                            : fill.colored
                              ? "font-medium text-white/90"
                              : "text-muted"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {clickable && (
                        <span className="mt-auto">
                          <span className="block text-[13px] font-semibold text-white">
                            {compactMoney(cell.pnl)}
                          </span>
                          <span className="block text-[10.5px] text-white/80">
                            {cell.trades} {cell.trades === 1 ? "trade" : "trades"}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: `rgb(${PROFIT_RGB})` }} />
          Profit day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded" style={{ backgroundColor: `rgb(${LOSS_RGB})` }} />
          Loss day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-accent/50" />
          Today
        </span>
        <span className="text-faint">Tap a day to view its trades</span>
      </div>

      {openDate && (
        <DayTradesModal
          title={dayLabel(openDate)}
          totalPnl={dayTotal}
          trades={dayTrades}
          loading={dayLoading}
          onClose={() => setOpenDate(null)}
        />
      )}
    </section>
  );
}
