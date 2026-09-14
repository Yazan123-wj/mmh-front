import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { loadPublishedCategories, mapCategory } from "@/server/catalog/map";
import { queryPublishedProducts } from "@/server/catalog/query";

export const metadata = pageMeta(
  "Gift cards",
  "PlayStation Store, Steam, Xbox, Nintendo, Google Play, and Apple gift cards in JOD.",
  "/gift-cards",
);

export default async function GiftCardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilterParams(params);
  const products = await queryPublishedProducts(filters, "gift-cards");
  const rows = await loadPublishedCategories();
  const subcategories = rows
    .filter((item) => !item.parentId)
    .slice(0, 8)
    .map((item) => mapCategory(item))
    .map((item) => ({ href: item.href, label: item.name }));

  return (
    <CategoryListing
      title="Gift Cards"
      breadcrumbs={[
        { href: "/", label: "MMH" },
        { href: "/shop", label: "Shop" },
        { label: "Gift Cards" },
      ]}
      subcategories={subcategories}
      initial={filters}
      source={products}
      basePath="/gift-cards"
    />
  );
}
