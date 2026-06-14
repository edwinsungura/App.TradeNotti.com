"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useMobileNav } from "./MobileNav";
import {
  SunIcon,
  JournalIcon,
  AnalyticsIcon,
  NotebookIcon,
  RulesIcon,
  PartnersIcon,
  ResourcesIcon,
  PinboardIcon,
  SettingsIcon,
  CloseIcon,
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
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

function NavLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: (p: { size?: number }) => React.ReactNode;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-ink text-white"
          : "text-ink hover:bg-black/[0.04]"
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
  const { open, setOpen } = useMobileNav();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  const close = () => setOpen(false);

  return (
    <>
      {/* Backdrop — mobile only, when the drawer is open */}
      {open && (
        <div
          onClick={close}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface px-3 py-4 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 pb-6 pt-1">
          <Logo />
          <button
            onClick={close}
            aria-label="Close menu"
            className="-mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/[0.04] lg:hidden"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={close}
            />
          ))}
        </nav>

        <div className="mt-6 px-3 pb-1">
          <span className="kicker">Library</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {LIBRARY.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={close}
            />
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
          {FOOTER.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={close}
            />
          ))}
        </div>
      </aside>
    </>
  );
}
