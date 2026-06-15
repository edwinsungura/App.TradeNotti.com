import Link from "next/link";
import AccountSwitcher, { type AccountOption } from "./AccountSwitcher";
import MobileMenuButton from "./MobileMenuButton";
import { BellIcon } from "./icons";
import { getCurrentUser } from "@/lib/account";

export default async function TopBar({
  accounts,
  activeId,
  userInitial,
}: {
  accounts: AccountOption[];
  activeId: string;
  userInitial: string;
}) {
  const user = await getCurrentUser();
  const initial = (user?.name ?? userInitial ?? "T").charAt(0).toUpperCase();
  const avatar = user?.avatarUrl ?? null;

  return (
    <header className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileMenuButton />
        <AccountSwitcher accounts={accounts} activeId={activeId} />
      </div>

      <div className="flex items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/[0.04]"
          aria-label="Notifications"
        >
          <BellIcon size={18} />
        </button>
        <Link
          href="/settings"
          aria-label="Settings"
          className="block h-9 w-9 overflow-hidden rounded-full"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
              {initial}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
