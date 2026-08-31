"use client";

import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/navigation/language-switcher";
import { MegaMenu, type MegaKey } from "@/components/navigation/mega-menu";
import { ICON_HIT } from "@/components/ui/control";
import { NAV_LINKS } from "@/data/navigation";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useUi } from "@/context/ui-context";
import { useWishlist } from "@/context/wishlist-context";
import { cn } from "@/lib/cn";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function Header() {
  const { t } = useLanguage();
  const { itemCount, hydrated } = useCart();
  const { items } = useWishlist();
  const { setSearchOpen, setCartOpen, setMobileNavOpen } = useUi();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMega, setOpenMega] = useState<MegaKey | null>(null);
  const [shownMega, setShownMega] = useState<MegaKey | null>(null);
  const [megaPath, setMegaPath] = useState(pathname);
  const closeTimer = useRef<number>(0);
  const reduceMotion = useReducedMotion();

  if (megaPath !== pathname) {
    setMegaPath(pathname);
    setOpenMega(null);
  }

  if (openMega && openMega !== shownMega) {
    setShownMega(openMega);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMega(null);
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-mmh-nav]")) return;
      setOpenMega(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, []);

  const open = (key: MegaKey | null) => {
    window.clearTimeout(closeTimer.current);
    setOpenMega(key);
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMega(null), 180);
  };

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header
      data-mmh-nav
      className={cn(
        "sticky top-0 z-[40] border-b border-line bg-elevated/94 backdrop-blur-md transition-shadow",
        scrolled && "shadow-[0_10px_40px_rgba(16,17,31,0.45)]",
      )}
      onMouseEnter={() => window.clearTimeout(closeTimer.current)}
      onMouseLeave={scheduleClose}
    >
      <div className="container-mmh flex h-16 items-center gap-1.5 sm:gap-3 lg:h-[72px]">
        <button
          type="button"
          className={cn(ICON_HIT, "border border-line lg:hidden")}
          onClick={() => setMobileNavOpen(true)}
          aria-label={t("nav.menu")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <Logo />

        <nav className="hidden flex-1 items-center justify-center lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href) || openMega === link.mega;
            return (
              <div key={link.href} onMouseEnter={() => (link.mega ? open(link.mega) : scheduleClose())}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative inline-flex h-11 items-center px-2.5 text-[13px] font-medium xl:px-3 xl:text-sm",
                    active ? "text-gold" : "text-muted hover:text-fg",
                  )}
                  aria-expanded={link.mega ? openMega === link.mega : undefined}
                  aria-haspopup={link.mega ? "true" : undefined}
                >
                  {t(link.labelKey)}
                  <span
                    className={cn(
                      "absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-gold transition-opacity",
                      active ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <div className="hidden md:block">
            <LanguageSwitcher compact />
          </div>
          <button type="button" className={ICON_HIT} onClick={() => setSearchOpen(true)} aria-label={t("nav.search")}>
            <Search className="h-5 w-5" />
          </button>
          <Link href="/account" className={cn(ICON_HIT, "hidden sm:inline-flex")} aria-label={t("nav.account")}>
            <User className="h-5 w-5" />
          </Link>
          <Link href="/wishlist" className={cn(ICON_HIT, "relative")} aria-label={t("nav.wishlist")}>
            <Heart className="h-5 w-5" />
            {hydrated && items.length > 0 ? (
              <span className="absolute top-2 end-2 h-2 w-2 rounded-full bg-gold" />
            ) : null}
          </Link>
          <button type="button" className={cn(ICON_HIT, "relative")} onClick={() => setCartOpen(true)} aria-label={t("nav.cart")}>
            <ShoppingBag className="h-5 w-5" />
            {hydrated && itemCount > 0 ? (
              <span className="absolute top-1.5 end-1.5 min-w-4 rounded-full bg-gold px-1 text-[10px] font-bold leading-4 text-elevated">
                {itemCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={
          reduceMotion
            ? { height: openMega ? "auto" : 0, opacity: openMega ? 1 : 0 }
            : { height: openMega ? "auto" : 0 }
        }
        transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "absolute inset-x-0 top-full z-[45] hidden overflow-hidden lg:block",
          !openMega && "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "border-b-2 border-gold/80 bg-card shadow-[0_24px_60px_rgba(16,17,31,0.45)] backdrop-blur-md",
            openMega && "mmh-mega-open",
          )}
        >
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent" />
          <AnimatePresence mode="wait">
            {shownMega ? (
              <motion.div
                key={shownMega}
                initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <MegaMenu type={shownMega} onNavigate={() => setOpenMega(null)} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </header>
  );
}
