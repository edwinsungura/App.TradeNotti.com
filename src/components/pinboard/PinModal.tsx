"use client";

import { useEffect, useState } from "react";
import type { PinData } from "@/lib/pinboard";
import type { PinDirection } from "@prisma/client";
import ImageLightbox from "../notebook/ImageLightbox";
import { CloseIcon, TrashIcon } from "../icons";

export default function PinModal({
  mode,
  image,
  pin,
  onClose,
  onSaved,
  onDeleted,
}: {
  mode: "create" | "edit";
  image: string;
  pin?: PinData;
  onClose: () => void;
  onSaved: (pin: PinData) => void;
  onDeleted?: (id: string) => void;
}) {
  const [symbol, setSymbol] = useState(pin?.symbol ?? "");
  const [timeframe, setTimeframe] = useState(pin?.timeframe ?? "");
  const [direction, setDirection] = useState<PinDirection | "">(pin?.direction ?? "");
  const [note, setNote] = useState(pin?.note ?? "");
  const [tags, setTags] = useState<string[]>(pin?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !zoom && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, zoom]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      image,
      symbol,
      timeframe,
      direction: direction || null,
      note,
      tags,
    };
    try {
      const res = await fetch(
        mode === "create" ? "/api/pinboard" : `/api/pinboard/${pin!.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        const { pin: saved } = await res.json();
        onSaved(saved);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!pin || !onDeleted) return;
    if (!window.confirm("Delete this pin?")) return;
    await fetch(`/api/pinboard/${pin.id}`, { method: "DELETE" });
    onDeleted(pin.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-xl sm:max-w-3xl sm:rounded-2xl md:flex-row">
        {/* Image */}
        <button
          onClick={() => setZoom(true)}
          className="flex max-h-[40vh] items-center justify-center bg-black/[0.03] md:max-h-none md:w-1/2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Chart" className="h-full w-full object-contain" />
        </button>

        {/* Form */}
        <div className="flex w-full flex-col overflow-y-auto p-5 md:w-1/2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">
              {mode === "create" ? "New pin" : "Edit pin"}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/[0.04]"
            >
              <CloseIcon size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Symbol">
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="EUR/USD"
                className="input"
              />
            </Field>
            <Field label="Timeframe">
              <input
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                placeholder="M15"
                className="input"
              />
            </Field>
          </div>

          <Field label="Direction">
            <div className="inline-flex rounded-lg bg-black/[0.04] p-0.5">
              {([["", "None"], ["LONG", "Long"], ["SHORT", "Short"]] as const).map(
                ([v, l]) => (
                  <button
                    key={l}
                    onClick={() => setDirection(v)}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                      direction === v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    {l}
                  </button>
                ),
              )}
            </div>
          </Field>

          <Field label="Note">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What's the setup / lesson?"
              className="input resize-y"
            />
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-[12px] text-ink-soft"
                >
                  {t}
                  <button onClick={() => setTags((p) => p.filter((x) => x !== t))}>×</button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="Add tag"
                className="w-24 bg-transparent text-[13px] outline-none"
              />
            </div>
          </Field>

          <div className="mt-auto flex items-center gap-2 pt-4">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "create" ? "Pin it" : "Save"}
            </button>
            {mode === "edit" && (
              <button
                onClick={remove}
                aria-label="Delete pin"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-muted hover:border-loss/40 hover:bg-loss-soft hover:text-loss"
              >
                <TrashIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {zoom && <ImageLightbox src={image} onClose={() => setZoom(false)} />}

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-line);
          padding: 0.5rem 0.75rem;
          font-size: 13.5px;
          outline: none;
        }
        :global(.input:focus) {
          border-color: color-mix(in srgb, var(--color-accent) 40%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="kicker mb-1 block">{label}</span>
      {children}
    </label>
  );
}
