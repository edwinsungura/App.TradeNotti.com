"use client";

import { useMobileNav } from "./MobileNav";
import { MenuIcon } from "./icons";

export default function MobileMenuButton() {
  const { setOpen } = useMobileNav();
  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open menu"
      className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-black/[0.04] lg:hidden"
    >
      <MenuIcon size={20} />
    </button>
  );
}
