"use client";

import { ProductRail } from "@/components/product/product-card";
import { getProductById } from "@/data/products";
import { useLanguage } from "@/context/language-context";
import { STORAGE_KEYS } from "@/lib/storage";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const { t } = useLanguage();
  const [ids] = useLocalStorage<string[]>(STORAGE_KEYS.recentlyViewed, []);
  const products = ids
    .filter((id) => id !== excludeId)
    .map((id) => getProductById(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .slice(0, 8);
  if (products.length === 0) return null;
  return (
    <section className="container-mmh pb-16">
      <h2 className="mb-6 text-lg font-semibold">{t("product.recent")}</h2>
      <ProductRail products={products} />
    </section>
  );
}
