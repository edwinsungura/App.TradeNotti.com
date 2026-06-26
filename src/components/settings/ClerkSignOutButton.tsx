"use client";

import { useClerk } from "@clerk/nextjs";
import { LogoutIcon } from "../icons";

export default function ClerkSignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut({ redirectUrl: "/login" })}
      className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-loss/40 hover:bg-loss-soft hover:text-loss"
    >
      <LogoutIcon size={16} /> Sign out
    </button>
  );
}
