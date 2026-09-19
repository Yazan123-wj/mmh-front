"use client";

import { useLanguage } from "@/context/language-context";
import Link from "next/link";

export function PromoSplit() {
  const { t } = useLanguage();
  return (
    <section className="container-mmh grid gap-4 pb-6 md:grid-cols-2">
      <Link href="/product/playstation-store-wallet" className="relative min-h-[180px] overflow-hidden rounded-[14px] border border-line bg-card p-5 sm:min-h-[240px] sm:p-8">
        <div className="absolute end-[-20%] top-[-30%] h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold">PlayStation</p>
        <h3 className="mt-3 max-w-xs text-2xl font-semibold sm:text-3xl">{t("home.psPromoTitle")}</h3>
        <p className="mt-3 max-w-sm text-sm text-muted">{t("home.psPromoBody")}</p>
      </Link>
      <Link href="/product/steam-wallet" className="relative min-h-[180px] overflow-hidden rounded-[14px] border border-line bg-card p-5 sm:min-h-[240px] sm:p-8">
        <div className="absolute end-[-20%] top-[-30%] h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Steam</p>
        <h3 className="mt-3 max-w-xs text-2xl font-semibold sm:text-3xl">{t("home.pcPromoTitle")}</h3>
        <p className="mt-3 max-w-sm text-sm text-muted">{t("home.pcPromoBody")}</p>
      </Link>
    </section>
  );
}
