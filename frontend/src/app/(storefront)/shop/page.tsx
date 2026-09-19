import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { resolveStorefrontCategories } from "@/server/catalog/resolve";
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
  const categories = await resolveStorefrontCategories();
  const subcategories = categories
    .filter((item) => !item.parent)
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
