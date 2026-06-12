// Shared display formatting for the Today page.

export function formatPrice(n: number | null): string {
  if (n == null) return "—";
  // Up to 5 dp for FX, trimmed; large prices (indices/metals) show 2 dp.
  const dp = Math.abs(n) >= 100 ? 2 : Math.abs(n) >= 10 ? 3 : 5;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
}

export function formatMoney(n: number | null): string {
  if (n == null) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatR(n: number | null): string {
  if (n == null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}R`;
}

// "Today · 09:42" style timestamp relative to now.
export function formatTradeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  if (sameDay) return `Today · ${time}`;

  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor(
    (new Date(now.toDateString()).getTime() -
      new Date(d.toDateString()).getTime()) /
      dayMs,
  );
  if (diffDays === 1) return `Yesterday · ${time}`;
  return `${diffDays}d ago · ${time}`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function formatLongDate(date = new Date()): string {
  return date
    .toLocaleDateString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}
