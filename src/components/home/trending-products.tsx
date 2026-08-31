"use client";

import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { PRODUCTS } from "@/data/products";
import { useLanguage } from "@/context/language-context";

export function TrendingProducts() {
  const { t } = useLanguage();
  const products = PRODUCTS.filter((product) => product.trending).slice(0, 8);
  return (
    <section className="container-mmh py-6">
      <SectionHeading
        title={t("home.trending")}
        subtitle={t("home.trendingSub")}
        actionHref="/shop?sort=newest"
        actionLabel={t("common.viewAll")}
      />
      <ProductGrid products={products} />
    </section>
  );
}
