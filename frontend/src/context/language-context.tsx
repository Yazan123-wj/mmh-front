"use client";

import { translate } from "@/data/translations";
import { STORAGE_KEYS } from "@/lib/storage";
import { useHydrated, useLocalStorage } from "@/hooks/use-local-storage";
import type { Locale } from "@/types";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";

interface LanguageContextValue {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  hydrated: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useLocalStorage<Locale>(STORAGE_KEYS.locale, "en");
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    applyDocumentLocale(locale === "ar" ? "ar" : "en");
  }, [locale, hydrated]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      applyDocumentLocale(next);
    },
    [setLocaleState],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale: locale === "ar" ? "ar" : "en",
      dir: locale === "ar" ? "rtl" : "ltr",
      setLocale,
      t: (key: string) => translate(locale === "ar" ? "ar" : "en", key),
      hydrated,
    }),
    [locale, setLocale, hydrated],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
