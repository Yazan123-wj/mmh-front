import { applyFilters } from "@/lib/catalog";
import { loadPublishedCatalog, loadPublishedCategories, mapProduct } from "@/server/catalog/map";
import type { FilterState, Product } from "@/types";

function categoryMatches(product: Product, slug: string, descendants: Set<string>) {
  if (descendants.has(product.category) || product.platform === slug) return true;
  if (slug === "game-top-ups") return product.fulfillmentType === "direct_topup";
  if (slug === "gift-cards") return ["gift_card", "wallet"].includes(product.digitalOptions.kind);
  if (slug === "deals" || slug === "special-offers") return Boolean(product.compareAtPriceJod && product.compareAtPriceJod > product.priceJod);
  if (slug === "best-sellers") return Boolean(product.bestseller);
  if (slug === "new-products") return product.badges.includes("new");
  return false;
}

export async function queryPublishedProducts(filters: FilterState, lockedCategory?: string) {
  const [rows, categoryRows] = await Promise.all([loadPublishedCatalog(), loadPublishedCategories()]);
  let products = rows.map(mapProduct);

  const requestedCategory = lockedCategory || filters.category;
  if (requestedCategory) {
    const root = categoryRows.find((category) => category.slug === requestedCategory);
    const ids = new Set<string>(root ? [root.id] : []);
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of categoryRows) {
        if (category.parentId && ids.has(category.parentId) && !ids.has(category.id)) {
          ids.add(category.id);
          changed = true;
        }
      }
    }
    const descendants = new Set(categoryRows.filter((category) => ids.has(category.id)).map((category) => category.slug));
    if (!descendants.size) descendants.add(requestedCategory);
    products = products.filter((product) => categoryMatches(product, requestedCategory, descendants));
  }

  const sortableFilters = filters.sort === "rating" && !products.some((product) => product.reviewCount > 0)
    ? { ...filters, sort: "featured" as const }
    : filters;
  return applyFilters(products, { ...sortableFilters, category: "" });
}
