import TopBar from "@/components/TopBar";
import EmptyAccount from "@/components/EmptyAccount";
import JournalView from "@/components/journal/JournalView";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getJournalTrades, getJournalFilterOptions } from "@/lib/journal";

export const dynamic = "force-dynamic";

export default async function JournalPage({
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

  const [trades, options] = await Promise.all([
    getJournalTrades(account.id),
    getJournalFilterOptions(account.id),
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
      <JournalView trades={trades} options={options} />
    </>
  );
}
