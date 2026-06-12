"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SunIcon,
  JournalIcon,
  AnalyticsIcon,
  NotebookIcon,
  RulesIcon,
  PartnersIcon,
  ResourcesIcon,
  PinboardIcon,
  GiftIcon,
  SettingsIcon,
} from "./icons";

const NAV = [
  { href: "/today", label: "Today", Icon: SunIcon },
  { href: "/journal", label: "Journal", Icon: JournalIcon },
  { href: "/analytics", label: "Analytics", Icon: AnalyticsIcon },
  { href: "/notebook", label: "Notebook", Icon: NotebookIcon },
  { href: "/rules", label: "Rules", Icon: RulesIcon },
  { href: "/partners", label: "Partners", Icon: PartnersIcon },
];

const LIBRARY = [
  { href: "/resources", label: "Resources", Icon: ResourcesIcon },
  { href: "/pinboard", label: "Pinboard", Icon: PinboardIcon },
];

const FOOTER = [
  { href: "/refer", label: "Refer & earn", Icon: GiftIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-ink text-white"
          : "text-ink-soft hover:bg-black/[0.04]"
      }`}
    >
      <span className={active ? "text-white" : "text-faint"}>
        <Icon size={18} />
      </span>
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-4">
      <div className="px-3 pb-5">
        <span className="text-[17px] font-semibold tracking-tight">
          TradeNotti
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="mt-6 px-3 pb-1">
        <span className="kicker">Library</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {LIBRARY.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
        {FOOTER.map((item) => (
          <NavLink key={item.href} {...item} active={isActive(item.href)} />
        ))}
      </div>
    </aside>
  );
}
