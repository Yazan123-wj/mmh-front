import { CATEGORIES } from "@/data/categories";
import { PRODUCTS, getProductBySlug } from "@/data/products";
import { loadPublishedCatalog, loadPublishedCategories, mapCategory, mapProduct } from "@/server/catalog/map";
import type { Category, Product } from "@/types";

/** Load published products from DB, falling back to the static catalog for demos / missing DB. */
export async function resolveStorefrontProducts(): Promise<Product[]> {
  try {
    if (!process.env.DATABASE_URL) return PRODUCTS;
    const rows = await loadPublishedCatalog();
    if (!rows.length) return PRODUCTS;
    return rows.map(mapProduct);
  } catch {
    return PRODUCTS;
  }
}

export async function resolveStorefrontCategories(): Promise<Category[]> {
  try {
    if (!process.env.DATABASE_URL) return CATEGORIES;
    const rows = await loadPublishedCategories();
    if (!rows.length) return CATEGORIES;
    const slugById = new Map(rows.map((category) => [category.id, category.slug]));
    return rows.map((category) =>
      mapCategory(category, category.parentId ? slugById.get(category.parentId) : undefined),
    );
  } catch {
    return CATEGORIES;
  }
}

export async function resolveStorefrontProduct(slug: string): Promise<Product | undefined> {
  try {
    if (process.env.DATABASE_URL) {
      const rows = await loadPublishedCatalog();
      const row = rows.find((item) => item.slug === slug);
      if (row) return mapProduct(row);
    }
  } catch {
    /* fall through to static catalog */
  }
  return getProductBySlug(slug);
}
