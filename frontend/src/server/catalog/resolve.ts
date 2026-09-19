import { CATEGORIES } from "@/data/categories";
import { PRODUCTS, getProductBySlug } from "@/data/products";
import { fetchApiCategories, fetchApiProduct, fetchApiProducts } from "@/server/catalog/from-api";
import type { Category, Product } from "@/types";

/**
 * Static catalog fallback is for development/demo UX only.
 * In production (NODE_ENV=production), fallback is OFF unless explicitly enabled —
 * a backend outage must never present stale prices/stock as purchasable truth.
 */
function allowStaticCatalogFallback(): boolean {
  if (process.env.NEXT_PUBLIC_ALLOW_STATIC_CATALOG_FALLBACK === "true") {
    return true;
  }
  if (process.env.NEXT_PUBLIC_ALLOW_STATIC_CATALOG_FALLBACK === "false") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}

/** Load published products from Django API, optionally falling back to static catalog. */
export async function resolveStorefrontProducts(): Promise<Product[]> {
  try {
    const rows = await fetchApiProducts();
    if (rows.length) return rows;
  } catch {
    /* fall through */
  }
  if (!allowStaticCatalogFallback()) return [];
  return PRODUCTS;
}

export async function resolveStorefrontCategories(): Promise<Category[]> {
  try {
    const rows = await fetchApiCategories();
    if (rows.length) return rows;
  } catch {
    /* fall through */
  }
  if (!allowStaticCatalogFallback()) return [];
  return CATEGORIES;
}

export async function resolveStorefrontProduct(slug: string): Promise<Product | undefined> {
  try {
    const row = await fetchApiProduct(slug);
    if (row) return row;
  } catch {
    /* fall through */
  }
  if (!allowStaticCatalogFallback()) return undefined;
  return getProductBySlug(slug);
}

export function isStaticCatalogFallbackEnabled(): boolean {
  return allowStaticCatalogFallback();
}
