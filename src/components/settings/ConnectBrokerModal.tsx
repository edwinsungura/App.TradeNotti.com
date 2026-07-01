"use client";

import { useEffect, useState } from "react";
import type { ManagedAccount } from "@/lib/settings";
import { CloseIcon } from "../icons";

const input =
  "w-full rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-accent/40";

export default function ConnectBrokerModal({
  mode,
  account,
  onClose,
  onDone,
}: {
  mode: "create" | "link";
  account?: ManagedAccount; // required for "link"
  onClose: () => void;
  onDone: (account: ManagedAccount) => void;
}) {
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"mt5" | "mt4">("mt5");
  const [login, setLogin] = useState("");
  const [server, setServer] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const connect = async () => {
    setSaving(true);
    setError(null);
    try {
      // In "create" mode we create the account first, then link the broker —
      // so the user connects in a single step (no second connection).
      let target: ManagedAccount;
      if (mode === "create") {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: name.trim() || `${platform.toUpperCase()} account`,
            broker: platform === "mt4" ? "MetaTrader 4" : "MetaTrader 5",
            currency: "USD",
            type: "LIVE",
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Could not create account.");
        target = j.account;
      } else {
        target = account!;
      }

      const res = await fetch("/api/broker/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: target.id, login, server, password, platform }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Could not connect.");

      onDone({ ...target, connected: true, brokerLogin: login, syncStatus: "idle" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative w-full rounded-t-2xl border border-line bg-surface p-6 shadow-xl sm:max-w-md sm:rounded-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">
            {mode === "create" ? "Add account" : "Connect MetaTrader"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.04]"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <p className="mb-4 text-[12.5px] text-muted">
          Connect your MetaTrader account to auto-import trades. Use your{" "}
          <strong>investor (read-only) password</strong> — TradeNotti can never
          place trades.
        </p>

        <div className="flex flex-col gap-3">
          {mode === "create" && (
            <label className="block">
              <span className="kicker mb-1 block">Account name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My live account"
                className={input}
              />
            </label>
          )}

          <div>
            <span className="kicker mb-1 block">Platform</span>
            <div className="inline-flex rounded-lg bg-white/[0.04] p-0.5">
              {(["mt5", "mt4"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
                    platform === p ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="kicker mb-1 block">Account login</span>
            <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="51234567" className={input} />
          </label>
          <label className="block">
            <span className="kicker mb-1 block">Server</span>
            <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="ICMarkets-Live01" className={input} />
          </label>
          <label className="block">
            <span className="kicker mb-1 block">Investor (read-only) password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={input}
            />
          </label>

          {error && <p className="text-[12.5px] text-loss">{error}</p>}

          <button
            onClick={connect}
            disabled={saving}
            className="mt-1 rounded-lg bg-accent px-4 py-2.5 text-[13px] font-medium text-white hover:bg-accent/90 disabled:opacity-60"
          >
            {saving ? "Connecting…" : "Connect & import"}
          </button>
        </div>
      </div>
    </div>
  );
}
