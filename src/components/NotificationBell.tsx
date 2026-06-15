"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NotificationData } from "@/lib/notifications";
import type { NotificationType } from "@prisma/client";
import {
  BellIcon,
  PartnersIcon,
  AnalyticsIcon,
  JournalIcon,
} from "./icons";

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function TypeIcon({ type }: { type: NotificationType }) {
  if (type === "PARTNER_REQUEST" || type === "PARTNER_ACCEPTED")
    return <PartnersIcon size={15} />;
  if (type === "INSIGHT") return <AnalyticsIcon size={15} />;
  if (type === "TRADE") return <JournalIcon size={15} />;
  return <BellIcon size={15} />;
}

export default function NotificationBell({
  initial,
  initialUnread,
}: {
  initial: NotificationData[];
  initialUnread: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationData[]>(initial);
  const [unread, setUnread] = useState(initialUnread);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setItems(j.notifications);
      setUnread(j.unread);
    }
  };

  useEffect(() => {
    if (!open) return;
    refresh();
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  };

  const openItem = async (n: NotificationData) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/[0.04]"
      >
        <BellIcon size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-loss px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-black/5">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-[13px] font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-[12px] font-medium text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-faint">
                You&apos;re all caught up.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-left last:border-0 hover:bg-black/[0.02] ${
                    n.read ? "" : "bg-accent-bg/30"
                  }`}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-bg text-accent">
                    <TypeIcon type={n.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-ink">{n.title}</span>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-faint">{relTime(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
