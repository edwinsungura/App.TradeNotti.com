import { ClockIcon } from "../icons";

// The AI-generated daily insight. Per product spec there is intentionally no
// "See report" or "Dismiss" action here.
export default function DailyInsightCard({
  category,
  text,
}: {
  category: string;
  text: string;
}) {
  return (
    <section className="rounded-2xl border border-accent/30 bg-accent-bg/70 p-6">
      <div className="kicker mb-3 text-accent/80">Daily insight · {category}</div>
      <div className="flex items-start gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
          <ClockIcon size={18} />
        </span>
        <p className="pt-1 text-[15px] leading-relaxed text-ink">{text}</p>
      </div>
    </section>
  );
}
