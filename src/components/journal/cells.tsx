import type { TradeDirection, TradeGrade } from "@prisma/client";

export function signedClass(n: number | null): string {
  if (n == null) return "text-faint";
  return n > 0 ? "text-profit" : n < 0 ? "text-loss" : "text-ink-soft";
}

export function DirBadge({
  direction,
  size = "sm",
}: {
  direction: TradeDirection;
  size?: "sm" | "lg";
}) {
  const long = direction === "LONG";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium ${
        size === "lg" ? "text-[15px]" : "text-[13px]"
      } ${long ? "text-profit" : "text-loss"}`}
    >
      <span aria-hidden className="text-[10px]">
        {long ? "▲" : "▼"}
      </span>
      {long ? "Long" : "Short"}
    </span>
  );
}

export function GradePill({ grade }: { grade: TradeGrade | null }) {
  if (!grade) return <span className="text-faint">—</span>;
  const high = grade === "HIGH_PROBABILITY";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11.5px] font-medium ${
        high
          ? "bg-grade-high-bg text-grade-high"
          : "bg-grade-low-bg text-grade-low"
      }`}
    >
      {high ? "High probability" : "Low probability"}
    </span>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line px-2 py-0.5 text-[11.5px] text-ink-soft">
      {children}
    </span>
  );
}
