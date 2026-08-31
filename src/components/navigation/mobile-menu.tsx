"use client";

import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { ICON_HIT } from "@/components/ui/control";
import { CATEGORIES } from "@/data/categories";
import { NAV_LINKS } from "@/data/navigation";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useUi } from "@/context/ui-context";
import { useScrollLock, useEscape } from "@/hooks/use-overlay";
import { ChevronDown, Heart, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const EXPAND: Record<string, string[]> = {
  "/shop": ["game-top-ups", "gift-cards", "playstation", "steam", "subscriptions", "deals"],
  "/game-top-ups": ["pubg-mobile", "free-fire", "mobile-legends", "roblox", "valorant", "fortnite", "ea-sports-fc"],
  "/gift-cards": ["playstation", "steam", "xbox", "nintendo", "apple", "google-play", "razer-gold"],
  "/category/playstation": ["playstation", "subscriptions"],
  "/category/mobile-games": ["pubg-mobile", "free-fire", "mobile-legends", "roblox"],
};

export function MobileMenu() {
  const { mobileNavOpen, setMobileNavOpen, setSearchOpen, setCartOpen } = useUi();
  const { t, locale } = useLanguage();
  const { itemCount, hydrated } = useCart();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useScrollLock(mobileNavOpen);
  useEscape(mobileNavOpen, () => setMobileNavOpen(false));

  useEffect(() => {
    if (mobileNavOpen) closeRef.current?.focus();
  }, [mobileNavOpen]);

  if (!mobileNavOpen) return null;

  const go = () => {
    setMobileNavOpen(false);
    setOpenGroup(null);
  };

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button type="button" className="absolute inset-0 bg-overlay" aria-label={t("nav.close")} onClick={go} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu")}
        className="absolute inset-y-0 start-0 flex h-full w-full max-w-[360px] flex-col bg-card pt-[env(safe-area-inset-top)] shadow-2xl"
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4 lg:h-[72px]">
          <Logo />
          <button ref={closeRef} type="button" className={ICON_HIT} onClick={go} aria-label={t("nav.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <button
            type="button"
            className="mb-3 flex h-12 w-full items-center gap-2 rounded-[12px] border border-line px-3 text-sm text-muted"
            onClick={() => {
              go();
              setSearchOpen(true);
            }}
          >
            <Search className="h-4 w-4" />
            {t("common.searchPlaceholder")}
          </button>
          {NAV_LINKS.map((link) => {
            const children = EXPAND[link.href];
            return (
              <div key={link.href} className="border-b border-line/70">
                <div className="flex items-center">
                  <Link href={link.href} className="flex h-12 min-h-12 flex-1 items-center px-2 text-sm font-medium text-muted hover:text-gold" onClick={go}>
                    {t(link.labelKey)}
                  </Link>
                  {children ? (
                    <button
                      type="button"
                      className={ICON_HIT}
                      onClick={() => setOpenGroup(openGroup === link.href ? null : link.href)}
                      aria-expanded={openGroup === link.href}
                      aria-label={t(link.labelKey)}
                    >
                      <ChevronDown className={`h-4 w-4 transition ${openGroup === link.href ? "rotate-180" : ""}`} />
                    </button>
                  ) : null}
                </div>
                {children && openGroup === link.href ? (
                  <div className="pb-3 ps-3">
                    {CATEGORIES.filter((category) => children.includes(category.slug)).map((category) => (
                      <Link
                        key={category.slug}
                        href={category.href}
                        className="flex h-11 min-h-11 items-center text-sm text-muted hover:text-gold"
                        onClick={go}
                      >
                        {locale === "ar" ? category.nameAr : category.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
          <Link href="/brands" className="flex h-12 items-center px-2 text-sm" onClick={go}>
            {t("nav.brands")}
          </Link>
          <Link href="/account" className="flex h-12 items-center gap-2 px-2 text-sm" onClick={go}>
            <User className="h-4 w-4" />
            {t("nav.account")}
          </Link>
          <Link href="/wishlist" className="flex h-12 items-center gap-2 px-2 text-sm" onClick={go}>
            <Heart className="h-4 w-4" />
            {t("nav.wishlist")}
          </Link>
          <button
            type="button"
            className="flex h-12 w-full items-center gap-2 px-2 text-start text-sm"
            onClick={() => {
              go();
              setCartOpen(true);
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            {t("nav.cart")}
            {hydrated && itemCount > 0 ? <span className="text-gold">({itemCount})</span> : null}
          </button>
        </nav>
        <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <LanguageSwitcher />
        </div>
      </aside>
    </div>
  );
}
