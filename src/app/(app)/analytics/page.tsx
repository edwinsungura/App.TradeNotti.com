import TopBar from "@/components/TopBar";
import EmptyAccount from "@/components/EmptyAccount";
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
    return <EmptyAccount />;
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
