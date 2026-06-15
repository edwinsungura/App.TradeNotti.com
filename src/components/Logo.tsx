// TradeNotti brand mark: bold wordmark with a rising chart line underneath.
// Recreated as inline SVG so it stays crisp at any size and tracks the theme.
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className ?? ""}`}>
      <span className="text-[18px] font-bold tracking-tight text-ink">
        TradeNotti
      </span>
      <svg
        viewBox="0 2 104 13"
        width={104}
        height={13}
        className="mt-0.5"
        fill="none"
        aria-hidden
      >
        {/* faint baseline */}
        <line
          x1="2"
          y1="14"
          x2="102"
          y2="14"
          stroke="var(--color-line)"
          strokeWidth="1"
        />
        {/* rising performance line */}
        <polyline
          points="2,12 16,8 30,10 44,6 58,8 72,7 86,8 100,4"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* mid hollow node */}
        <circle
          cx="72"
          cy="7"
          r="1.8"
          fill="var(--color-surface)"
          stroke="var(--color-accent)"
          strokeWidth="1.3"
        />
        {/* end node with soft halo */}
        <circle cx="100" cy="4" r="3.4" fill="var(--color-accent)" opacity="0.18" />
        <circle cx="100" cy="4" r="1.8" fill="var(--color-accent)" />
      </svg>
    </span>
  );
}
