"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NoteSummary } from "@/lib/notebook";
import { ArrowLeftIcon, PlusIcon, JournalIcon } from "../icons";

function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DayView({
  date,
  notes,
}: {
  date: string;
  notes: NoteSummary[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const newPage = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/notebook/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (res.ok) {
        const { note } = await res.json();
        router.push(`/notebook/${date}/${note.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/notebook"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-ink"
        >
          <ArrowLeftIcon size={15} /> Notebook
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {dayLabel(date)}
          </h1>
          <button
            onClick={newPage}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-60"
          >
            <PlusIcon size={15} /> {creating ? "Creating…" : "New page"}
          </button>
        </div>

        {notes.length === 0 ? (
          <button
            onClick={newPage}
            disabled={creating}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-muted hover:border-accent/50 hover:text-accent"
          >
            <PlusIcon size={22} />
            <span className="text-[14px] font-medium">
              Create the first page for this day
            </span>
          </button>
        ) : (
          <ul className="flex flex-col gap-2">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notebook/${date}/${n.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-bg text-accent">
                    <JournalIcon size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">
                      {n.title || "Untitled"}
                    </span>
                    <span className="block text-[12px] text-faint">
                      Edited {timeLabel(n.updatedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
