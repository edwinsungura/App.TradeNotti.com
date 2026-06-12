import AccountSwitcher, { type AccountOption } from "./AccountSwitcher";
import { BellIcon } from "./icons";

export default function TopBar({
  accounts,
  activeId,
  userInitial,
}: {
  accounts: AccountOption[];
  activeId: string;
  userInitial: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <AccountSwitcher accounts={accounts} activeId={activeId} />

      <div className="flex items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/[0.04]"
          aria-label="Notifications"
        >
          <BellIcon size={18} />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-medium text-white">
          {userInitial}
        </span>
      </div>
    </header>
  );
}
