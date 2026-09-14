import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { loadPublishedCategories, mapCategory } from "@/server/catalog/map";
import { queryPublishedProducts } from "@/server/catalog/query";

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
  const filters = parseFilterParams(params);
  const products = await queryPublishedProducts(filters);
  const rows = await loadPublishedCategories();
  const subcategories = rows
    .filter((item) => !item.parentId)
    .map((item) => mapCategory(item))
    .map((item) => ({ href: item.href, label: item.name }));

  return (
    <CategoryListing
      title="Shop"
      breadcrumbs={[
        { href: "/", label: "MMH" },
        { label: "Shop" },
      ]}
      subcategories={subcategories}
      initial={filters}
      source={products}
      basePath="/shop"
    />
  );
}
