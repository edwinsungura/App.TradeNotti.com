"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronIcon } from "./icons";

export interface AccountOption {
  id: string;
  label: string;
  broker: string;
  currency: string;
  type: "LIVE" | "DEMO";
}

export default function AccountSwitcher({
  accounts,
  activeId,
}: {
  accounts: AccountOption[];
  activeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = accounts.find((a) => a.id === activeId) ?? accounts[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!active) return null;

  function select(id: string) {
    setOpen(false);
    router.push(id === activeId ? "/today" : `/today?account=${id}`);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2 text-left transition-colors hover:bg-black/[0.02]"
      >
        <span className="h-2 w-2 rounded-full bg-profit" />
        <span className="leading-tight">
          <span className="block text-[13px] font-semibold">
            {active.type === "LIVE" ? "Live" : "Demo"} · {active.label}
          </span>
          <span className="block text-[11px] text-faint">
            {active.broker} · {active.currency}
          </span>
        </span>
        <span className="text-faint">
          <ChevronIcon size={16} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg shadow-black/5">
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => select(a.id)}
              className={`flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm hover:bg-black/[0.03] ${
                a.id === activeId ? "font-semibold" : ""
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-profit" />
              <span className="leading-tight">
                <span className="block text-[13px]">
                  {a.type === "LIVE" ? "Live" : "Demo"} · {a.label}
                </span>
                <span className="block text-[11px] text-faint">
                  {a.broker} · {a.currency}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
