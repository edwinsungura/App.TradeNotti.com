import TopBar from "@/components/TopBar";
import RulebookView from "@/components/rules/RulebookView";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getRulesForAccount } from "@/lib/rules";

export const dynamic = "force-dynamic";

export default async function RulesPage({
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

  const rules = await getRulesForAccount(account.id);
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
      <RulebookView initialRules={rules} />
    </>
  );
}
