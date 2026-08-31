"use client";

import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SITE } from "@/config/site";
import { PRODUCTS } from "@/data/products";
import { useLanguage } from "@/context/language-context";
import { useHydrated } from "@/hooks/use-local-storage";
import { useSyncExternalStore } from "react";

let nowCache = 0;

function subscribeNow(onChange: () => void) {
  nowCache = Date.now();
  const timer = window.setInterval(() => {
    nowCache = Date.now();
    onChange();
  }, 1000);
  return () => window.clearInterval(timer);
}

function DealsClock() {
  const now = useSyncExternalStore(subscribeNow, () => nowCache, () => 0);
  if (!now) return <span className="text-muted">Campaign ends 15 Sep 2026, 21:00 Amman</span>;
  const diff = Math.max(0, new Date(SITE.campaignEndsAt).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return (
    <>
      <span className="text-muted">Ends</span>
      <strong>
        {days}d {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </strong>
    </>
  );
}

export function DealsSection() {
  const { t } = useLanguage();
  const hydrated = useHydrated();
  const deals = PRODUCTS.filter((product) => product.compareAtPriceJod).slice(0, 8);

  return (
    <section className="container-mmh py-10 md:py-12">
      <SectionHeading
        title={t("home.deals")}
        subtitle={t("home.dealsSub")}
        actionHref="/deals"
        actionLabel={t("common.viewAll")}
      />
      <div className="mb-6 inline-flex items-center gap-3 rounded-[12px] border border-line bg-card px-4 py-3 text-sm">
        {hydrated ? <DealsClock /> : <span className="text-muted">Campaign ends 15 Sep 2026, 21:00 Amman</span>}
      </div>
      <ProductGrid products={deals} />
    </section>
  );
}
