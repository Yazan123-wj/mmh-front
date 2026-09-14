import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { loadPublishedCategories, mapCategory } from "@/server/catalog/map";
import { queryPublishedProducts } from "@/server/catalog/query";

export const metadata = pageMeta(
  "Game top-ups",
  "Direct top-ups for PUBG Mobile, Free Fire, Mobile Legends, and more. Sold by MMH in Jordan.",
  "/game-top-ups",
);

export default async function GameTopUpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilterParams(params);
  const products = await queryPublishedProducts(filters, "game-top-ups");
  const rows = await loadPublishedCategories();
  const mobile = rows.find((item) => item.slug === "mobile-games");
  const subcategories = (
    mobile
      ? rows.filter((item) => item.parentId === mobile.id)
      : rows.filter((item) => !item.parentId)
  )
    .map((item) => mapCategory(item))
    .map((item) => ({ href: item.href, label: item.name }));

  return (
    <CategoryListing
      title="Game Top-Ups"
      breadcrumbs={[
        { href: "/", label: "MMH" },
        { href: "/shop", label: "Shop" },
        { label: "Game Top-Ups" },
      ]}
      subcategories={subcategories}
      initial={filters}
      source={products}
      basePath="/game-top-ups"
    />
  );
}
