import { CategoryListing } from "@/components/shop/category-listing";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { resolveStorefrontCategories } from "@/server/catalog/resolve";
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
  const categories = await resolveStorefrontCategories();
  const subcategories = categories
    .filter((item) => !item.parent)
    .slice(0, 8)
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
