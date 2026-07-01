"use client";

import { useMobileNav } from "./MobileNav";
import { MenuIcon, SidebarIcon } from "./icons";

// Left-of-topbar nav control. On mobile it opens the slide-in drawer; on desktop
// it toggles the Notion-style sidebar collapse.
export default function MobileMenuButton() {
  const { setOpen, collapsed, setCollapsed } = useMobileNav();
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/[0.04]";
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className={`-ml-1 lg:hidden ${btn}`}
      >
        <MenuIcon size={20} />
      </button>
      {/* Desktop: only shown while collapsed, to bring the sidebar back.
          When expanded, the collapse control lives in the sidebar header. */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Show sidebar"
          title="Show sidebar"
          className={`-ml-1 hidden lg:flex ${btn}`}
        >
          <SidebarIcon size={19} />
        </button>
      )}
    </>
  );
}
