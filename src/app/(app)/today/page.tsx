import TopBar from "@/components/TopBar";
import DailyInsightCard from "@/components/today/DailyInsightCard";
import TodaysTrades from "@/components/today/TodaysTrades";
import TradingRules from "@/components/today/TradingRules";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getOpenTrades } from "@/lib/trades";
import { getRulesForAccount } from "@/lib/rules";
import { getTodayInsight } from "@/lib/ai/daily-insight";
import { greeting, formatLongDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: accountParam } = await searchParams;

  const [user, accounts, account] = await Promise.all([
    getCurrentUser(),
    getAccountsForCurrentUser(),
    getActiveAccount(accountParam),
  ]);

  if (!account) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        No account found. Run the seed to get started.
      </div>
    );
  }

  const [trades, rules, insight] = await Promise.all([
    getOpenTrades(account.id),
    getRulesForAccount(account.id),
    getTodayInsight(account.id),
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "trader";
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
          <div className="kicker mb-2">{formatLongDate()}</div>
          <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting()}, {firstName}.
          </h1>

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
