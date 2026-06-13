"use client";

import { useState } from "react";
import type { JournalDetail } from "@/lib/journal";
import type { TradeGrade } from "@prisma/client";
import { signedClass } from "./cells";

type Source = "AUTO" | "JOURNAL";

function SourceBadge({ source }: { source: Source }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide ${
        source === "AUTO"
          ? "bg-black/[0.05] text-faint"
          : "bg-accent-bg text-accent"
      }`}
    >
      {source}
    </span>
  );
}

function Row({
  label,
  source,
  children,
}: {
  label: string;
  source: Source;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-[13px] text-muted">
        {label}
        <SourceBadge source={source} />
      </span>
      <span className="text-[13.5px] font-medium text-ink">{children}</span>
    </div>
  );
}

const selectClass =
  "cursor-pointer rounded-md bg-transparent text-right text-[13.5px] font-medium text-ink outline-none hover:text-accent";

export default function OutcomePanel({
  detail,
  metrics,
  onChange,
}: {
  detail: JournalDetail;
  metrics: {
    pnl: string;
    rMultiple: string;
    roi: string;
    positionSize: string;
    stopLoss: string;
    duration: string;
    entryAt: string;
    exitAt: string;
  };
  onChange: (patch: Partial<JournalDetail>) => void;
}) {
  const [saving, setSaving] = useState(false);

  const patch = async (body: Partial<JournalDetail>) => {
    onChange(body);
    setSaving(true);
    try {
      await fetch(`/api/trades/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="kicker mb-2">Outcome</div>
      <div className={`text-[28px] font-bold tracking-tight ${signedClass(detail.pnl)}`}>
        {metrics.pnl}
      </div>
      <div className={`mb-4 text-[14px] font-medium ${signedClass(detail.rMultiple)}`}>
        {metrics.rMultiple}
      </div>

      <div className="flex flex-col">
        <Row label="Entry date" source="AUTO">
          {metrics.entryAt}
        </Row>
        <Row label="Exit trade" source="AUTO">
          {detail.closedAt ? `${metrics.exitAt} · ${metrics.duration}` : "Open"}
        </Row>
        <Row label="Stop loss" source="JOURNAL">
          {metrics.stopLoss}
        </Row>
        <Row label="Position size" source="AUTO">
          {metrics.positionSize}
        </Row>
        <Row label="ROI" source="AUTO">
          <span className={signedClass(detail.roi)}>{metrics.roi}</span>
        </Row>

        <Row label="Trade grade" source="JOURNAL">
          <select
            value={detail.grade ?? ""}
            onChange={(e) =>
              patch({ grade: (e.target.value || null) as TradeGrade | null })
            }
            className={selectClass}
          >
            <option value="">—</option>
            <option value="HIGH_PROBABILITY">High probability</option>
            <option value="LOW_PROBABILITY">Low probability</option>
          </select>
        </Row>

        <Row label="Market direction" source="JOURNAL">
          <select
            value={detail.marketDirection ?? ""}
            onChange={(e) => patch({ marketDirection: e.target.value || null })}
            className={selectClass}
          >
            <option value="">—</option>
            <option>Bullish</option>
            <option>Bearish</option>
            <option>Ranging</option>
          </select>
        </Row>

        <Row label="Phase of market" source="JOURNAL">
          <select
            value={detail.phaseOfMarket ?? ""}
            onChange={(e) => patch({ phaseOfMarket: e.target.value || null })}
            className={selectClass}
          >
            <option value="">—</option>
            <option>Accumulation</option>
            <option>Markup</option>
            <option>Distribution</option>
            <option>Markdown</option>
          </select>
        </Row>
      </div>

      <p className="mt-3 text-[11px] text-faint">
        {saving ? "Saving…" : "AUTO pulled from your broker · JOURNAL entered by you"}
      </p>
    </section>
  );
}
