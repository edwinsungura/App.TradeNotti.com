import TopBar from "@/components/TopBar";
import PartnersView from "@/components/partners/PartnersView";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getPartnersData } from "@/lib/partners";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const [user, accounts, account] = await Promise.all([
    getCurrentUser(),
    getAccountsForCurrentUser(),
    getActiveAccount(),
  ]);

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">
        No user found. Run the seed to get started.
      </div>
    );
  }

  const data = await getPartnersData(user.id);
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
        activeId={account?.id ?? ""}
        userInitial={initial}
      />
      <PartnersView initial={data} />
    </>
  );
}
