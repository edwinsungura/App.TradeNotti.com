import { notFound } from "next/navigation";
import TopBar from "@/components/TopBar";
import TradeDetail from "@/components/journal/TradeDetail";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getTradeDetail } from "@/lib/journal";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, accounts, account] = await Promise.all([
    getCurrentUser(),
    getAccountsForCurrentUser(),
    getActiveAccount(),
  ]);

  if (!account) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        No account found. Run the seed to get started.
      </div>
    );
  }

  const trade = await getTradeDetail(account.id, id);
  if (!trade) notFound();

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
      <TradeDetail trade={trade} />
    </>
  );
}
