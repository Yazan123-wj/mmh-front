"use client";

import { useLanguage } from "@/context/language-context";
import { FOCUS_RING } from "@/components/ui/control";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="inline-flex rounded-[10px] border border-line p-0.5" role="group" aria-label={t("common.language")}>
      {(["en", "ar"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "h-8 min-w-9 rounded-[8px] px-2 text-xs font-semibold uppercase",
            FOCUS_RING,
            locale === code ? "bg-brand text-fg" : "text-muted hover:text-fg",
            compact && "min-w-8 px-1.5",
          )}
          aria-pressed={locale === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
