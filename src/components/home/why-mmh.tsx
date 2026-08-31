"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { useLanguage } from "@/context/language-context";

const KEYS = ["home.why1", "home.why2", "home.why3", "home.why4", "home.why5", "home.why6"] as const;

export function WhyMmh() {
  const { t } = useLanguage();
  return (
    <section className="container-mmh py-10 md:py-16">
      <SectionHeading title={t("home.why")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KEYS.map((key, index) => (
          <div key={key} className="rounded-[12px] border border-line bg-card p-5">
            <p className="text-xs text-gold">0{index + 1}</p>
            <p className="mt-2 font-medium">{t(key)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
