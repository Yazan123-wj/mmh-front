import { PRODUCTS } from "@/data/products";

export const ONEEPIN_PRODUCTS_PAGE = "https://www.1epin.com/products/";

export interface OneEpinCatalogEntry {
  categoryId: string;
  slug: string;
  href: string;
  imageFile: string;
  name: string;
}

/** Ordered patterns — first match wins. Patterns apply to category name and slug. */
export const ONEEPIN_IMAGE_RULES: Record<string, string[]> = {
  "psn-store": ["playstation network usa", "playstation network us"],
  "ps-plus": ["playstation network usa", "playstation network us"],
  "steam-wallet": ["\\bsteam usd\\b", "\\bsteam wallet\\b", "\\bsteam games global\\b"],
  "xbox-gift": ["xbox usd gift card", "xbox turkey"],
  "nintendo-eshop": ["^nintendo$", "nintendo eshop"],
  "apple-gift": ["itunes apple store usd \\(unlimited stock\\)", "itunes apple store usd"],
  "google-play": ["^google play gift card$", "google play gift"],
  "razer-gold": ["razer gold usd global", "razer gold usd"],
  "roblox-card": ["roblox usd", "roblox gift"],
  "pubg-uc": ["pubg mobile top-up \\(global\\)", "pubg mobile global e-pin"],
  "free-fire": ["free fire diamonds - id top-up", "free fire global pin"],
  "mlbb-diamonds": ["mobile legends bang bang global", "mobile legends diamonds"],
  "valorant-points": ["valorant usa", "valorant vp"],
  "fortnite-vbucks": ["fortnite usa", "epic games \\(fortnite\\)"],
  "ea-fc-points": ["ea sports fc 26 ea - pc global", "ea sports fc 26"],
  "lol-card": ["^league of legends \\(lol\\)$", "league of legends \\(lol\\)"],
};

const PERMISSION_NOTE =
  "Supplier category artwork retrieved from 1Epin (www.1epin.com/products/). MMH uses this only as supplier-provided product identification for mapped digital SKUs. Artwork is category-level, not denomination-specific. Verify reuse terms with your 1Epin account agreement; a public page URL is not proof of permission on its own.";

export function parseOneEpinCatalogHtml(html: string): OneEpinCatalogEntry[] {
  const entries: OneEpinCatalogEntry[] = [];
  const pattern =
    /href="(\/products\/category\/(\d+)\/([^"]+))" data-i="\d+" data-r="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    entries.push({
      href: match[1],
      categoryId: match[2],
      slug: match[3],
      imageFile: match[4],
      name: match[5].replace(/&amp;/g, "&").trim(),
    });
  }
  return entries;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchOneEpinCategory(entry: OneEpinCatalogEntry, pattern: string): boolean {
  const rx = new RegExp(pattern, "i");
  const name = normalize(entry.name);
  const slug = normalize(entry.slug).replace(/-/g, " ");
  return rx.test(name) || rx.test(slug);
}

export function resolveOneEpinImageForProduct(
  productId: string,
  catalog: OneEpinCatalogEntry[],
): OneEpinCatalogEntry | undefined {
  const patterns = ONEEPIN_IMAGE_RULES[productId];
  if (!patterns) return undefined;
  for (const pattern of patterns) {
    const hit = catalog.find((entry) => matchOneEpinCategory(entry, pattern));
    if (hit) return hit;
  }
  return undefined;
}

export function buildOneEpinImagePlan(catalog: OneEpinCatalogEntry[]) {
  return PRODUCTS.map((product) => {
    const match = resolveOneEpinImageForProduct(product.id, catalog);
    return {
      productId: product.id,
      slug: product.slug,
      matched: Boolean(match),
      categoryId: match?.categoryId,
      categoryName: match?.name,
      imageFile: match?.imageFile,
      sourcePageUrl: match ? `${ONEEPIN_PRODUCTS_PAGE}` : undefined,
      sourceUrl: match ? `https://www.1epin.com/images/oyun/${match.imageFile}` : undefined,
      permissionNote: PERMISSION_NOTE,
      alt: match
        ? `${product.name} — supplier category artwork from 1Epin. Generic category image, not denomination-specific.`
        : undefined,
    };
  });
}

export { PERMISSION_NOTE as ONEEPIN_IMAGE_PERMISSION_NOTE };
