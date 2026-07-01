import TopBar from "@/components/TopBar";
import EmptyAccount from "@/components/EmptyAccount";
import DailyInsightCard from "@/components/today/DailyInsightCard";
import TodaysTrades from "@/components/today/TodaysTrades";
import TradingRules from "@/components/today/TradingRules";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getActiveAccountIds,
  getCurrentUser,
} from "@/lib/account";
import { getOpenTrades } from "@/lib/trades";
import { getRulesForAccount } from "@/lib/rules";
import { getTodayInsight } from "@/lib/ai/daily-insight";
import { greeting, formatLongDate, titleCase } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: accountParam } = await searchParams;

  const [user, accounts, account, accountIds] = await Promise.all([
    getCurrentUser(),
    getAccountsForCurrentUser(),
    getActiveAccount(accountParam),
    getActiveAccountIds(accountParam),
  ]);

  if (!account) {
    return <EmptyAccount />;
  }

  const [trades, rules, insight] = await Promise.all([
    // Open trades aggregate across the selected accounts; rules + the daily
    // insight stay scoped to the primary (first selected) account.
    getOpenTrades(accountIds),
    getRulesForAccount(account.id),
    getTodayInsight(account.id),
  ]);

  const displayName = titleCase(user?.name ?? "trader");
  const initial = (user?.name ?? "T").charAt(0).toUpperCase();

  return (
    <>
      <TopBar
        accounts={accounts.map((a) => ({
          id: a.id,
          label: a.label,
          broker: a.broker,
          currency: a.currency,
          type: a.type,
        }))}
        activeId={account.id}
        userInitial={initial}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="relative mb-8 overflow-hidden">
            {/* Signature rising-line motif, faint, behind the greeting. */}
            <svg
              aria-hidden
              className="pointer-events-none absolute -top-3 right-0 h-24 w-[62%] opacity-[0.08]"
              viewBox="0 0 400 60"
              fill="none"
              preserveAspectRatio="none"
            >
              <polyline
                points="0,50 60,38 120,44 180,20 240,30 300,17 360,25 400,5"
                stroke="var(--color-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="400" cy="5" r="5" fill="var(--color-accent)" />
            </svg>
            <div className="kicker relative mb-2">{formatLongDate()}</div>
            <h1 className="relative text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-gradient">
                {greeting()}, {displayName}.
              </span>
            </h1>
          </div>

          <div className="flex flex-col gap-5">
            <DailyInsightCard category={insight.category} text={insight.text} />
            <TodaysTrades initialTrades={trades} accountId={account.id} />
            <TradingRules rules={rules} />
          </div>
        </div>
      </div>
    </>
  );
}
