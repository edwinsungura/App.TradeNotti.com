export default function WinLossDonut({
  winRate,
}: {
  winRate: number | null;
}) {
  const pct = winRate ?? 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative h-[132px] w-[132px] shrink-0">
      <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="rgb(0,0,0)"
          strokeOpacity={0.06}
          strokeWidth={14}
        />
        <circle
          cx="66"
          cy="66"
          r={r}
          fill="none"
          stroke="rgb(22,163,74)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[22px] font-bold tracking-tight">
          {winRate == null ? "—" : `${Math.round(pct)}%`}
        </span>
      </div>
    </div>
  );
}
