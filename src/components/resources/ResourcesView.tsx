"use client";

import { useState } from "react";
import type { DocSummary, DocData } from "@/lib/resources";
import DocPanel from "./DocPanel";
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

export default function ResourcesView({
  initialDocs,
}: {
  initialDocs: DocSummary[];
}) {
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
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Resources</h1>
            <p className="mt-1 max-w-xl text-[13.5px] text-muted">
              Your trading documents — plan, routines, psychology notes, watchlists.
              The system gets smarter the more of yourself you put in here.
            </p>
          </div>
          <button
            onClick={newDoc}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-60"
          >
            <PlusIcon size={15} /> {creating ? "Creating…" : "New document"}
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* Documents list */}
          <aside className="rounded-2xl border border-line bg-surface p-2.5">
            <div className="kicker px-2 py-2">Documents</div>

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
      </div>
    </div>
  );
}
