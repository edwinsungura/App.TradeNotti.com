"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MonthNote } from "@/lib/notebook";
import { ChevronIcon, PlusIcon } from "../icons";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ymd(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1))
    .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .toUpperCase();
}

function groupByDate(list: MonthNote[]): Map<string, MonthNote[]> {
  const map = new Map<string, MonthNote[]>();
  for (const n of list) {
    const arr = map.get(n.date) ?? [];
    arr.push(n);
    map.set(n.date, arr);
  }
  return map;
}

export default function NotebookCalendar({
  initialYear,
  initialMonth,
  initialNotes,
}: {
  initialYear: number;
  initialMonth: number;
  initialNotes: MonthNote[];
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [notes, setNotes] = useState<Map<string, MonthNote[]>>(
    () => groupByDate(initialNotes),
  );
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const todayKey = ymd(new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())));

  const loadMonth = async (y: number, m: number) => {
    setLoading(true);
    try {
      const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/notebook/notes?month=${ym}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setNotes(groupByDate(json.notes as MonthNote[]));
      }
    } finally {
      setLoading(false);
    }
  };

  const shift = (delta: number) => {
    let y = year;
    let m = month + delta;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setYear(y);
    setMonth(m);
    loadMonth(y, m);
  };

  const goToday = () => {
    const y = today.getFullYear();
    const m = today.getMonth();
    setYear(y);
    setMonth(m);
    loadMonth(y, m);
  };

  // Build a 6-week grid, Sunday-first.
  const first = new Date(Date.UTC(year, month, 1));
  const gridStart = new Date(first.getTime() - first.getUTCDay() * 864e5);
  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notebook</h1>
            <p className="mt-1 max-w-xl text-[13.5px] text-muted">
              A blank master calendar. Click any day to write — start from a template
              or a blank page, save your own templates, and customise every page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="kicker mr-1 hidden sm:inline">{monthLabel(year, month)}</span>
            <button
              onClick={() => shift(-1)}
              disabled={loading}
              aria-label="Previous month"
              className="flex h-8 w-8 rotate-90 items-center justify-center rounded-lg border border-line text-muted hover:bg-white/[0.04]"
            >
              <ChevronIcon size={16} />
            </button>
            <button
              onClick={goToday}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-white/[0.04]"
            >
              Today
            </button>
            <button
              onClick={() => shift(1)}
              disabled={loading}
              aria-label="Next month"
              className="flex h-8 w-8 -rotate-90 items-center justify-center rounded-lg border border-line text-muted hover:bg-white/[0.04]"
            >
              <ChevronIcon size={16} />
            </button>
            <button
              onClick={() => router.push(`/notebook/${todayKey}`)}
              className="ml-1 flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:bg-accent/90"
            >
              <PlusIcon size={15} /> New
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-surface">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7 border-b border-line">
              {WEEKDAYS.map((d) => (
                <div key={d} className="kicker px-3 py-2">
                  {d}
                </div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((d) => {
                  const key = ymd(d);
                  const inMonth = d.getUTCMonth() === month;
                  const dayNotes = notes.get(key) ?? [];
                  const isToday = key === todayKey;
                  return (
                    <button
                      key={key}
                      onClick={() => router.push(`/notebook/${key}`)}
                      className={`group relative flex min-h-[112px] flex-col border-b border-r border-line/70 p-2 text-left transition-colors last:border-r-0 hover:bg-accent-bg/40 ${
                        inMonth ? "" : "bg-white/[0.015]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[12px] ${
                            isToday
                              ? "flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-semibold text-white"
                              : inMonth
                                ? "text-ink-soft"
                                : "text-faint"
                          }`}
                        >
                          {d.getUTCDate() === 1
                            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
                            : d.getUTCDate()}
                        </span>
                        <span className="flex h-5 w-5 items-center justify-center rounded text-faint opacity-0 transition-opacity group-hover:opacity-100">
                          <PlusIcon size={14} />
                        </span>
                      </div>

                      {dayNotes.length > 0 && (
                        <span className="mt-1.5 flex flex-col gap-1">
                          {dayNotes.slice(0, 2).map((n) => (
                            <span
                              key={n.id}
                              className="truncate rounded-md bg-accent-bg px-2 py-1 text-[12px] font-medium text-accent"
                            >
                              {n.title || "Untitled"}
                            </span>
                          ))}
                          {dayNotes.length > 2 && (
                            <span className="px-1 text-[11px] font-medium text-faint">
                              +{dayNotes.length - 2} more
                            </span>
                          )}
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
    </div>
  );
}
