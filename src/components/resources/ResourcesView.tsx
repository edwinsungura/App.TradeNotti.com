"use client";

import { useState } from "react";
import type { DocSummary, DocData } from "@/lib/resources";
import type { MonthGrid } from "@/lib/habits";
import DocPanel from "./DocPanel";
import HabitTracker from "./HabitTracker";
import { JournalIcon, PlusIcon } from "../icons";

function updatedLabel(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

type Tab = "habits" | "docs";

export default function ResourcesView({
  initialDocs,
  initialHabits,
}: {
  initialDocs: DocSummary[];
  initialHabits: MonthGrid;
}) {
  const [tab, setTab] = useState<Tab>("habits");
  const [docs, setDocs] = useState<DocSummary[]>(initialDocs);
  const [selected, setSelected] = useState<string | null>(initialDocs[0]?.id ?? null);
  const [doc, setDoc] = useState<DocData | null>(null);
  const [creating, setCreating] = useState(false);

  const openDoc = async (id: string) => {
    setSelected(id);
    setDoc(null);
    const res = await fetch(`/api/resources/${id}`, { cache: "no-store" });
    if (res.ok) {
      const { doc } = await res.json();
      setDoc(doc);
    }
  };

  const newDoc = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled" }),
      });
      if (res.ok) {
        const { doc } = await res.json();
        setDocs((prev) => [{ id: doc.id, title: doc.title, updatedAt: doc.updatedAt }, ...prev]);
        setDoc(doc);
        setSelected(doc.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const onDocSaved = (id: string, title: string) =>
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title, updatedAt: new Date().toISOString() } : d)),
    );

  const onDocDelete = (id: string) => {
    setDocs((prev) => {
      const next = prev.filter((d) => d.id !== id);
      setSelected(next[0]?.id ?? null);
      return next;
    });
    setDoc(null);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Resources</h1>
          <p className="mt-1 max-w-xl text-[13.5px] text-muted">
            Build discipline with a habit streak tracker, and keep your trading
            documents — plan, routines, psychology notes — all in one place.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1">
          <TabButton active={tab === "habits"} onClick={() => setTab("habits")}>
            🌱 Habits
          </TabButton>
          <TabButton active={tab === "docs"} onClick={() => setTab("docs")}>
            📄 Documents
          </TabButton>
        </div>

        {tab === "habits" ? (
          <HabitTracker initial={initialHabits} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            {/* Documents list */}
            <aside className="rounded-2xl border border-line bg-surface p-2.5">
              <div className="flex items-center justify-between px-2 py-2">
                <span className="kicker">Documents</span>
                <button
                  onClick={newDoc}
                  disabled={creating}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium text-accent hover:bg-accent-bg disabled:opacity-60"
                >
                  <PlusIcon size={14} /> New
                </button>
              </div>

              {docs.length === 0 ? (
                <p className="px-2.5 py-3 text-[13px] text-faint">
                  No documents yet. Create your first one.
                </p>
              ) : (
                docs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => openDoc(d.id)}
                    className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                      selected === d.id ? "bg-accent-bg" : "hover:bg-black/[0.03]"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-soft">
                      <JournalIcon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-medium text-ink">
                        {d.title || "Untitled"}
                      </span>
                      <span className="block text-[11.5px] text-faint">
                        Updated {updatedLabel(d.updatedAt)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </aside>

            {/* Detail pane */}
            <div>
              {selected && doc ? (
                <DocPanel doc={doc} onSaved={onDocSaved} onDelete={onDocDelete} />
              ) : selected ? (
                <section className="rounded-2xl border border-line bg-surface p-10 text-center text-sm text-faint">
                  Loading…
                </section>
              ) : (
                <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line p-14 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-faint">
                    <JournalIcon size={20} />
                  </span>
                  <p className="text-[14px] font-medium text-ink">No document selected</p>
                  <button
                    onClick={newDoc}
                    className="rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent/90"
                  >
                    Create a document
                  </button>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active ? "bg-gradient-to-br from-accent to-[#9d7bff] text-white" : "text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
