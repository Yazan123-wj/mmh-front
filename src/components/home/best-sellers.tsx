"use client";

import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { PRODUCTS } from "@/data/products";
import { useLanguage } from "@/context/language-context";

export function BestSellers() {
  const { t } = useLanguage();
  const products = PRODUCTS.filter((product) => product.bestseller).slice(0, 8);
  return (
    <section className="container-mmh py-6">
      <SectionHeading title={t("home.bestSellers")} actionHref="/shop?sort=rating" actionLabel={t("common.viewAll")} />
      <ProductGrid products={products} />
    </section>
  );
}
