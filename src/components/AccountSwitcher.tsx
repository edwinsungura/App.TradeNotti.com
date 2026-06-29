"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronIcon, CheckIcon } from "./icons";

export interface AccountOption {
  id: string;
  label: string;
  broker: string;
  currency: string;
  type: "LIVE" | "DEMO";
}

// Resolve the ?account= param to the set of selected account ids.
function resolveSelected(
  param: string | null,
  accounts: AccountOption[],
): string[] {
  if (!param) return [accounts[0].id];
  if (param === "all") return accounts.map((a) => a.id);
  const requested = param.split(",").map((s) => s.trim());
  const valid = accounts.filter((a) => requested.includes(a.id)).map((a) => a.id);
  return valid.length > 0 ? valid : [accounts[0].id];
}

export default function AccountSwitcher({
  accounts,
}: {
  accounts: AccountOption[];
  // activeId is no longer needed — selection comes from the URL — but kept
  // optional so existing TopBar call sites don't need to change.
  activeId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (accounts.length === 0) return null;

  const multi = accounts.length > 1;
  const selectedIds = resolveSelected(searchParams.get("account"), accounts);
  const selected = new Set(selectedIds);
  const isAll = multi && selectedIds.length === accounts.length;
  const single = selectedIds.length === 1 ? accounts.find((a) => a.id === selectedIds[0]) : null;

  // Push a new selection into the URL, keeping the current page.
  function apply(nextIds: string[]) {
    if (nextIds.length === 0) return; // never allow an empty selection
    let value: string | null;
    if (multi && nextIds.length === accounts.length) value = "all";
    else if (nextIds.length === 1 && nextIds[0] === accounts[0].id) value = null;
    else value = nextIds.join(",");
    router.push(value ? `${pathname}?account=${value}` : pathname);
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id); // keep at least one selected
    } else {
      next.add(id);
    }
    apply(accounts.filter((a) => next.has(a.id)).map((a) => a.id));
  }

  function toggleAll() {
    apply(isAll ? [accounts[0].id] : accounts.map((a) => a.id));
  }

  const label = isAll
    ? "All accounts"
    : single
      ? `${single.type === "LIVE" ? "Live" : "Demo"} · ${single.label}`
      : `${selectedIds.length} accounts`;
  const sub = single
    ? `${single.broker} · ${single.currency}`
    : `${selectedIds.length} of ${accounts.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2 text-left transition-colors hover:bg-black/[0.02]"
      >
        <span className="h-2 w-2 rounded-full bg-profit" />
        <span className="leading-tight">
          <span className="block text-[13px] font-semibold">{label}</span>
          <span className="block text-[11px] text-faint">{sub}</span>
        </span>
        <span className="text-faint">
          <ChevronIcon size={16} />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg shadow-black/5">
          {multi && (
            <>
              <Row
                checked={isAll}
                onClick={toggleAll}
                title="All accounts"
                subtitle={`Combine all ${accounts.length}`}
              />
              <div className="my-1 border-t border-line" />
            </>
          )}
          {accounts.map((a) => (
            <Row
              key={a.id}
              checked={selected.has(a.id)}
              onClick={() => toggle(a.id)}
              title={`${a.type === "LIVE" ? "Live" : "Demo"} · ${a.label}`}
              subtitle={`${a.broker} · ${a.currency}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  checked,
  onClick,
  title,
  subtitle,
}: {
  checked: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm hover:bg-black/[0.03]"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          checked ? "border-ink bg-ink text-white" : "border-line text-transparent"
        }`}
      >
        <CheckIcon size={12} />
      </span>
      <span className="leading-tight">
        <span className={`block text-[13px] ${checked ? "font-semibold" : ""}`}>
          {title}
        </span>
        <span className="block text-[11px] text-faint">{subtitle}</span>
      </span>
    </button>
  );
}
