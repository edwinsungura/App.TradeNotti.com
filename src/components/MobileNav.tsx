"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface NavState {
  // Mobile drawer (overlay) open/closed.
  open: boolean;
  setOpen: (v: boolean) => void;
  // Desktop collapse — Notion style. When collapsed the sidebar leaves the
  // layout and only peeks in on hover; persisted across sessions.
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const NavContext = createContext<NavState>({
  open: false,
  setOpen: () => {},
  collapsed: false,
  setCollapsed: () => {},
});

const STORAGE_KEY = "sidebar-collapsed";

export function MobileNavProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsedState] = useState(false);

  // Hydrate the persisted collapse preference after mount (avoids SSR mismatch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    setCollapsedState(window.localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    }
  };

  return (
    <NavContext.Provider value={{ open, setOpen, collapsed, setCollapsed }}>
      {children}
    </NavContext.Provider>
  );
}

export const useMobileNav = () => useContext(NavContext);
