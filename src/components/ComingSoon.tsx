// Lightweight placeholder for nav destinations not yet built. The Today page is
// the focus of this milestone; these keep the sidebar links navigable.
export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted">
        This section is coming soon. The Today dashboard is live — head back to
        see your daily insight, open trades, and rules.
      </p>
    </div>
  );
}
