"use client";

import { useLanguage } from "@/context/language-context";
import { ShieldCheck, Zap, BadgeCheck, MapPin } from "lucide-react";

export function TrustStrip() {
  const { t } = useLanguage();
  const items = [
    { icon: Zap, key: "home.trustDelivery" },
    { icon: ShieldCheck, key: "home.trustSecure" },
    { icon: BadgeCheck, key: "home.trustAuth" },
    { icon: MapPin, key: "home.trustInstant" },
  ];
  return (
    <section className="border-b border-line bg-elevated/60">
      <div className="container-mmh grid grid-cols-2 gap-3 py-5 sm:gap-4 sm:py-6 md:grid-cols-4">
        {items.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-brand/15 text-accent sm:h-10 sm:w-10">
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-xs font-medium leading-4 sm:text-sm sm:leading-5">{t(key)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
