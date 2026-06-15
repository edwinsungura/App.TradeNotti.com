"use client";

import { useState } from "react";
import type { PerformanceData, Period } from "@/lib/resources";
import { formatMoney, formatR } from "@/lib/format";
import { UploadIcon } from "../icons";

const PERIODS: { id: Period; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "yearly", label: "Yearly" },
];

function downloadCsv(data: PerformanceData) {
  const head = ["Period", "Trades", "Wins", "Losses", "Win rate %", "Avg R", "Net P&L", "Avg win", "Avg loss"];
  const lines = data.rows.map((r) =>
    [r.period, r.trades, r.wins, r.losses, Math.round(r.winRate), r.avgR?.toFixed(2) ?? "", r.net.toFixed(2), r.avgWin?.toFixed(2) ?? "", r.avgLoss?.toFixed(2) ?? ""].join(","),
  );
  const csv = [head.join(","), ...lines].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `trading-performance-${data.period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PerformancePanel({
  accountId,
  initial,
}: {
  accountId: string;
  initial: PerformanceData;
}) {
  const [data, setData] = useState(initial);
  const [period, setPeriod] = useState<Period>(initial.period);
  const [loading, setLoading] = useState(false);

  const changePeriod = async (p: Period) => {
    if (p === period) return;
    setPeriod(p);
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/performance?period=${p}&accountId=${accountId}`, {
        cache: "no-store",
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="kicker mb-1">Auto-updated · live</div>
          <h2 className="text-[17px] font-semibold">Trading performance</h2>
        </div>
        <button
          onClick={() => downloadCsv(data)}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
        >
          <UploadIcon size={14} /> Export
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className={`inline-flex rounded-lg bg-black/[0.04] p-0.5 ${loading ? "opacity-60" : ""}`}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => changePeriod(p.id)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                period === p.id ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="kicker border-b border-line [&>th]:px-3 [&>th]:pb-2.5 [&>th]:font-semibold">
              <th className="!pl-0">Period</th>
              <th className="text-right">Trades</th>
              <th className="text-right">W / L</th>
              <th className="text-right">Win rate</th>
              <th className="text-right">Avg R</th>
              <th className="text-right">Net P&amp;L</th>
              <th className="!pr-0 text-right">Avg win / loss</th>
            </tr>
          </thead>
          <tbody className="text-[13.5px]">
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-faint">
                  No closed trades yet.
                </td>
              </tr>
            ) : (
              data.rows.map((r) => (
                <tr key={r.key} className="border-b border-line/60 last:border-0 [&>td]:px-3 [&>td]:py-3.5">
                  <td className="!pl-0 font-medium">{r.period}</td>
                  <td className="num text-right">{r.trades}</td>
                  <td className="num text-right">
                    <span className="text-profit">{r.wins}</span>
                    <span className="text-faint"> / {r.losses}</span>
                  </td>
                  <td className="num text-right text-ink-soft">{Math.round(r.winRate)}%</td>
                  <td className="num text-right text-ink-soft">{formatR(r.avgR)}</td>
                  <td className={`num text-right font-medium ${r.net >= 0 ? "text-profit" : "text-loss"}`}>
                    {formatMoney(r.net)}
                  </td>
                  <td className="num !pr-0 text-right">
                    <span className="text-profit">
                      {r.avgWin == null ? "—" : formatMoney(r.avgWin)}
                    </span>
                    <span className="text-faint"> / </span>
                    <span className="text-loss">
                      {r.avgLoss == null ? "—" : formatMoney(r.avgLoss)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
