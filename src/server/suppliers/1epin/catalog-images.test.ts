import { describe, expect, it, vi } from "vitest";
import {
  ONEEPIN_IMAGE_RULES,
  matchOneEpinCategory,
  parseOneEpinCatalogHtml,
  resolveOneEpinImageForProduct,
} from "@/server/suppliers/1epin/catalog-images";
import { assertSafeOneEpinImageUrl, isPrivateIp, UnsafeRemoteUrlError } from "@/server/media/safe-fetch";
import { planOneEpinImageImport } from "@/server/catalog/import-1epin-images";
import { isCatalogManagedStoredName } from "@/server/catalog/artwork-sources";

const SAMPLE_HTML = `
<a href="/products/category/89/google-play-gift-card" data-i="89" data-r="7dde06e8-3765-41d7-9713-d714a85c0316.webp">Google Play Gift Card</a>
<a href="/products/category/4593/steam-argentina" data-i="4593" data-r="dfc23ec8-01a6-44d5-8b45-41b23e19ce60.webp">Steam Argentina</a>
<a href="/products/category/9999/steam-usd" data-i="9999" data-r="ebc51263-ca4a-4b04-8586-3dd762f2f77b.webp">Steam USD</a>
<a href="/products/category/100/playstation-network-usa" data-i="100" data-r="fb0abda7-c096-430b-8bb8-12c4596dbf93.webp">PlayStation Network USA</a>
`;

vi.mock("@/server/db", () => ({
  prisma: {
    product: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

describe("1Epin catalog image parser", () => {
  it("parses category image metadata from the public products page", () => {
    const catalog = parseOneEpinCatalogHtml(SAMPLE_HTML);
    expect(catalog).toHaveLength(4);
    expect(catalog[0].imageFile).toBe("7dde06e8-3765-41d7-9713-d714a85c0316.webp");
  });

  it("resolves MMH products using ordered rules", () => {
    const catalog = parseOneEpinCatalogHtml(SAMPLE_HTML);
    expect(resolveOneEpinImageForProduct("steam-wallet", catalog)?.name).toBe("Steam USD");
    expect(resolveOneEpinImageForProduct("google-play", catalog)?.name).toBe("Google Play Gift Card");
    expect(resolveOneEpinImageForProduct("psn-store", catalog)?.name).toBe("PlayStation Network USA");
  });

  it("matches category names case-insensitively", () => {
    const entry = parseOneEpinCatalogHtml(
      '<a href="/products/category/1/test" data-i="1" data-r="abc.webp">EA Sports FC 26 EA - PC Global</a>',
    )[0];
    expect(matchOneEpinCategory(entry, "ea sports fc 26 ea - pc global")).toBe(true);
  });

  it("defines rules for all 16 MMH products", () => {
    expect(Object.keys(ONEEPIN_IMAGE_RULES)).toHaveLength(16);
  });
});

describe("1Epin image fetch guards", () => {
  it("rejects non-image paths on 1epin host", async () => {
    await expect(assertSafeOneEpinImageUrl("https://www.1epin.com/api/test/categories/")).rejects.toBeInstanceOf(
      UnsafeRemoteUrlError,
    );
  });

  it("rejects private IPs", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });

  it("treats catalog webp assets as managed", () => {
    expect(isCatalogManagedStoredName("catalog-steam-wallet.webp")).toBe(true);
    expect(isCatalogManagedStoredName("catalog-steam-wallet.svg")).toBe(true);
  });
});

describe("1Epin image import planning", () => {
  it("plans skip when products are not in the database", async () => {
    const plans = await planOneEpinImageImport(parseOneEpinCatalogHtml(SAMPLE_HTML));
    expect(plans.some((item) => item.action === "import")).toBe(false);
    expect(plans.every((item) => item.action === "skip-missing-product")).toBe(true);
  });
});
