import TopBar from "@/components/TopBar";
import ResourcesView from "@/components/resources/ResourcesView";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { listDocs } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function ResourcesPage({
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

  if (!account || !user) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        No account found. Run the seed to get started.
      </div>
    );
  }

  const docs = await listDocs(user.id);

  const initial = (user.name ?? "T").charAt(0).toUpperCase();

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
      <ResourcesView initialDocs={docs} />
    </>
  );
}
