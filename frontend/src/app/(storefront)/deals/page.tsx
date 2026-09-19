import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { queryPublishedProducts } from "@/server/catalog/query";

export const metadata = pageMeta("Deals", "Discounted digital codes and top-up packages.", "/deals");

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = { ...parseFilterParams(params), discount: true };
  const products = await queryPublishedProducts(filters, "deals");

  return (
    <CategoryListing
      title="Deals"
      breadcrumbs={[
        { href: "/", label: "MMH" },
        { href: "/shop", label: "Shop" },
        { label: "Deals" },
      ]}
      subcategories={[
        { href: "/gift-cards", label: "Gift Cards" },
        { href: "/game-top-ups", label: "Game Top-Ups" },
        { href: "/shop", label: "All products" },
      ]}
      initial={filters}
      source={products}
      basePath="/deals"
    />
  );
}
