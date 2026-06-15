"use client";

import { useRef, useState } from "react";
import type { PinData } from "@/lib/pinboard";
import PinModal from "./PinModal";
import { ImageIcon, UploadIcon } from "../icons";

// Downscale + compress an image File to a JPEG data URL.
async function compress(file: File, max = 1400, quality = 0.82): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new window.Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return "Today";
  const days = Math.round((now.getTime() - d.getTime()) / 864e5);
  if (days <= 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function PinboardView({ initial }: { initial: PinData[] }) {
  const [pins, setPins] = useState<PinData[]>(initial);
  const [draft, setDraft] = useState<string | null>(null); // new pin image
  const [editing, setEditing] = useState<PinData | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setDraft(await compress(file));
  };

  return (
    <div
      className="flex-1 overflow-y-auto"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Pinboard</h1>
            <p className="mt-1 max-w-xl text-[13.5px] text-muted">
              Drag in chart screenshots from MetaTrader 4 / 5 — or any platform.
              Tag them, group them, keep the ones you&apos;d repeat in a heartbeat
              front and centre.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
            >
              <ImageIcon size={15} /> Pin from MT4 / MT5
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent/90"
            >
              <UploadIcon size={15} /> Upload screenshot
            </button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Masonry board */}
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {pins.map((p) => (
            <PinCard key={p.id} pin={p} onClick={() => setEditing(p)} time={relTime(p.createdAt)} />
          ))}

          {/* Drop tile */}
          <button
            onClick={() => fileRef.current?.click()}
            className={`mb-4 flex aspect-[4/3] w-full break-inside-avoid flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-faint transition-colors ${
              dragOver ? "border-accent bg-accent-bg/40 text-accent" : "border-line hover:border-accent/50"
            }`}
          >
            <ImageIcon size={22} />
            <span className="text-[13px] font-medium">Drop screenshot</span>
            <span className="text-[11.5px]">PNG, JPG from MT4 / MT5 / TradingView</span>
          </button>
        </div>

        {pins.length === 0 && (
          <p className="mt-2 text-center text-[12px] text-faint">
            Your board is empty — upload your first chart above.
          </p>
        )}
      </div>

      {draft && (
        <PinModal
          mode="create"
          image={draft}
          onClose={() => setDraft(null)}
          onSaved={(pin) => {
            setPins((prev) => [pin, ...prev]);
            setDraft(null);
          }}
        />
      )}
      {editing && (
        <PinModal
          mode="edit"
          image={editing.image}
          pin={editing}
          onClose={() => setEditing(null)}
          onSaved={(pin) => {
            setPins((prev) => prev.map((p) => (p.id === pin.id ? pin : p)));
            setEditing(null);
          }}
          onDeleted={(id) => {
            setPins((prev) => prev.filter((p) => p.id !== id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function PinCard({
  pin,
  time,
  onClick,
}: {
  pin: PinData;
  time: string;
  onClick: () => void;
}) {
  const long = pin.direction === "LONG";
  const short = pin.direction === "SHORT";
  return (
    <button
      onClick={onClick}
      className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface text-left transition-shadow hover:shadow-md"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pin.image} alt={pin.symbol ?? "Chart"} className="w-full object-cover" />
        {(pin.symbol || pin.timeframe) && (
          <div className="absolute left-2 top-2 flex gap-1">
            {pin.symbol && (
              <span className="rounded-md bg-surface/90 px-1.5 py-0.5 text-[11px] font-semibold text-ink shadow-sm backdrop-blur">
                {pin.symbol}
              </span>
            )}
            {pin.timeframe && (
              <span className="rounded-md bg-surface/90 px-1.5 py-0.5 text-[11px] font-medium text-muted shadow-sm backdrop-blur">
                {pin.timeframe}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-3.5">
        {(pin.timeframe || pin.direction) && (
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[12px] text-faint">{pin.timeframe}</span>
            {pin.direction && (
              <span
                className={`flex items-center gap-1 text-[12px] font-medium ${
                  long ? "text-profit" : "text-loss"
                }`}
              >
                <span aria-hidden className="text-[9px]">{long ? "▲" : "▼"}</span>
                {short ? "Short" : "Long"}
              </span>
            )}
          </div>
        )}
        {pin.note && (
          <p className="text-[13px] leading-snug text-ink-soft">{pin.note}</p>
        )}
        {pin.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pin.tags.map((t) => (
              <span
                key={t}
                className="rounded-md border border-line px-2 py-0.5 text-[11px] text-ink-soft"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="mt-2.5 text-[11px] text-faint">{time}</p>
      </div>
    </button>
  );
}
