import TopBar from "@/components/TopBar";
import PinboardView from "@/components/pinboard/PinboardView";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { listPins } from "@/lib/pinboard";

export const dynamic = "force-dynamic";

export default async function PinboardPage() {
  const [user, accounts, account] = await Promise.all([
    getCurrentUser(),
    getAccountsForCurrentUser(),
    getActiveAccount(),
  ]);

  const pins = user ? await listPins(user.id) : [];
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
        activeId={account?.id ?? ""}
        userInitial={initial}
      />
      <PinboardView initial={pins} />
    </>
  );
}
