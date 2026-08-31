import { ShopCatalog } from "@/components/shop/shop-catalog";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Shop digital gaming products in Jordan",
  "Browse MMH gift cards, wallet credit, subscriptions, and game top-ups with JOD pricing.",
  "/shop",
);

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="container-mmh py-6 sm:py-10">
      <h1 className="mb-6 text-2xl font-semibold sm:mb-8 sm:text-3xl">Shop</h1>
      <ShopCatalog initial={parseFilterParams(params)} />
    </div>
  );
}
