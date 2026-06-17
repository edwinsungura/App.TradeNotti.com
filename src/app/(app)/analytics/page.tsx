import TopBar from "@/components/TopBar";
import AnalyticsView from "@/components/analytics/AnalyticsView";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getAnalytics, getCalendar } from "@/lib/analytics";
import { getPerformance } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
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

  const now = new Date();
  const [analytics, calendar, performance] = await Promise.all([
    getAnalytics(account.id, "month"),
    getCalendar(account.id, now.getUTCFullYear(), now.getUTCMonth()),
    getPerformance(account.id, "monthly"),
  ]);

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
      <AnalyticsView
        initial={analytics}
        initialCalendar={calendar}
        performance={performance}
        accountId={account.id}
      />
    </>
  );
}
