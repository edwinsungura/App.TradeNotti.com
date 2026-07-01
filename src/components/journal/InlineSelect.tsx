"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "../icons";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Notion-style inline property select: the value reads as plain inline text (or
 * a custom trigger like a colored pill); clicking opens a small popover menu of
 * options with a check on the current one. No native <select> chrome.
 */
export default function InlineSelect({
  value,
  options,
  placeholder = "—",
  onChange,
  renderTrigger,
}: {
  value: string | null;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string | null) => void;
  renderTrigger?: (current: SelectOption | null) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = options.find((o) => o.value === value) ?? null;

  function pick(next: string | null) {
    setOpen(false);
    if (next !== value) onChange(next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13.5px] font-medium outline-none transition-colors hover:bg-white/[0.04]"
      >
        {renderTrigger ? (
          renderTrigger(current)
        ) : (
          <span className={current ? "text-ink" : "text-faint"}>
            {current ? current.label : placeholder}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lg shadow-black/10">
          <Option
            label={placeholder}
            active={value == null}
            muted
            onClick={() => pick(null)}
          />
          {options.map((o) => (
            <Option
              key={o.value}
              label={o.label}
              active={o.value === value}
              onClick={() => pick(o.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Option({
  label,
  active,
  muted,
  onClick,
}: {
  label: string;
  active: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-white/[0.04]"
    >
      <span className={muted ? "text-faint" : "text-ink"}>{label}</span>
      {active && (
        <span className="text-accent">
          <CheckIcon size={13} />
        </span>
      )}
    </button>
  );
}
