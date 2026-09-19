"use client";

import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getProductById } from "@/data/products";
import { useLanguage } from "@/context/language-context";
import { useWishlist } from "@/context/wishlist-context";

export function WishlistView() {
  const { items, hydrated } = useWishlist();
  const { t } = useLanguage();
  if (!hydrated) return <div className="container-mmh py-16">{t("common.loading")}</div>;
  const products = items.map((item) => getProductById(item.productId)).filter((product): product is NonNullable<typeof product> => Boolean(product));
  return (
    <div className="container-mmh py-10">
      <h1 className="mb-6 text-2xl font-semibold sm:mb-8 sm:text-3xl">{t("nav.wishlist")}</h1>
      {products.length === 0 ? (
        <EmptyState title={t("empty.wishlist")} actionHref="/shop" actionLabel={t("cart.emptyCta")} />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
