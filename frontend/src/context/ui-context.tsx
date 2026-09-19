"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface UiContextValue {
  searchOpen: boolean;
  cartOpen: boolean;
  mobileNavOpen: boolean;
  quickViewSlug: string | null;
  setSearchOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  openQuickView: (slug: string) => void;
  closeQuickView: () => void;
}

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  const openQuickView = useCallback((slug: string) => setQuickViewSlug(slug), []);
  const closeQuickView = useCallback(() => setQuickViewSlug(null), []);

  const value = useMemo(
    () => ({
      searchOpen,
      cartOpen,
      mobileNavOpen,
      quickViewSlug,
      setSearchOpen,
      setCartOpen,
      setMobileNavOpen,
      openQuickView,
      closeQuickView,
    }),
    [searchOpen, cartOpen, mobileNavOpen, quickViewSlug, openQuickView, closeQuickView],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const context = useContext(UiContext);
  if (!context) throw new Error("useUi must be used within UiProvider");
  return context;
}
