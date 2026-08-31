import { ShopCatalog } from "@/components/shop/shop-catalog";
import { PRODUCTS } from "@/data/products";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Deals", "Discounted digital codes and top-up packages.", "/deals");

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="container-mmh py-6 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">Deals</h1>
      <p className="mt-2 mb-8 text-sm text-muted">Campaign pricing shown on your device. Ends 15 Sep 2026, 21:00 Amman time.</p>
      <ShopCatalog
        initial={{ ...parseFilterParams(params), discount: true }}
        source={PRODUCTS.filter((product) => Boolean(product.compareAtPriceJod))}
        basePath="/deals"
      />
    </div>
  );
}
