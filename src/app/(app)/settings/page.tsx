import TopBar from "@/components/TopBar";
import SettingsView from "@/components/settings/SettingsView";
import {
  getAccountsForCurrentUser,
  getActiveAccount,
  getCurrentUser,
} from "@/lib/account";
import { getProfile, listManagedAccounts } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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

  const [profile, managed] = await Promise.all([
    getProfile(user.id),
    listManagedAccounts(user.id),
  ]);

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
      {profile && <SettingsView profile={profile} accounts={managed} />}
    </>
  );
}
