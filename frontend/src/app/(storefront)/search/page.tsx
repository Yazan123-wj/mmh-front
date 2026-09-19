import { ShopCatalog } from "@/components/shop/shop-catalog";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { queryPublishedProducts } from "@/server/catalog/query";

export const metadata = pageMeta("Search MMH", "Find Roblox, PUBG UC, PlayStation, Steam, and other digital products.", "/search");

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  const filters = parseFilterParams(params);
  const products = await queryPublishedProducts(filters);
  return (
    <div className="container-mmh py-6 sm:py-10">
      <h1 className="break-words text-2xl font-semibold sm:text-3xl">Search{q ? `: ${q}` : ""}</h1>
      <ShopCatalog initial={filters} source={products} basePath="/search" />
    </div>
  );
}
