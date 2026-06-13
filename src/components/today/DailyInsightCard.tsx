import { TrendingUpIcon } from "../icons";

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
    <section className="rounded-2xl border border-accent/30 bg-accent-bg/70 px-7 py-8">
      <div className="kicker mb-5 text-accent/80">Daily insight · {category}</div>
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
          <TrendingUpIcon size={20} />
        </span>
        <p className="pt-1.5 text-[15px] leading-relaxed text-ink">{text}</p>
      </div>
    </section>
  );
}
