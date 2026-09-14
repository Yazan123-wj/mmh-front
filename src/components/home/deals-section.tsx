"use client";

import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { PRODUCTS } from "@/data/products";
import { getSnapshotProducts } from "@/lib/catalog-snapshot";
import { useLanguage } from "@/context/language-context";

export function DealsSection() {
  const { t } = useLanguage();
  const catalog = getSnapshotProducts();
  const deals = (catalog.length ? catalog : PRODUCTS).filter((product) => product.compareAtPriceJod).slice(0, 8);

  return (
    <section className="container-mmh py-10 md:py-12">
      <SectionHeading
        title={t("home.deals")}
        subtitle={t("home.dealsSub")}
        actionHref="/deals"
        actionLabel={t("common.viewAll")}
      />
      <ProductGrid products={deals} />
    </section>
  );
}
