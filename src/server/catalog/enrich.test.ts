import { describe, expect, it, vi } from "vitest";
import { isPrivateIp, sniffImageType, sanitizeSvg, UnsafeRemoteUrlError, assertSafePublicHttpsUrl } from "@/server/media/safe-fetch";
import { adminArtworkLocked, copyPatchFromProduct, assertNoPriceWrites } from "@/server/catalog/enrich";
import { buildIdentificationTile, nameOnlyTile } from "@/server/catalog/identification-tile";
import { artworkForProduct, isCatalogManagedStoredName } from "@/server/catalog/artwork-sources";
import { PRODUCTS } from "@/data/products";

vi.mock("@/server/db", () => ({
  prisma: {
    product: { findMany: vi.fn(), update: vi.fn() },
    productTranslation: { update: vi.fn() },
    productMedia: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    mediaAsset: { findMany: vi.fn(), upsert: vi.fn() },
    regionTranslation: { updateMany: vi.fn() },
  },
}));

describe("safe remote fetch guards", () => {
  it("flags private IPv4 ranges", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.0.0.8")).toBe(true);
    expect(isPrivateIp("192.168.1.9")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });

  it("rejects non-https and non-allowlisted hosts", async () => {
    await expect(assertSafePublicHttpsUrl("http://upload.wikimedia.org/file.svg")).rejects.toBeInstanceOf(UnsafeRemoteUrlError);
    await expect(assertSafePublicHttpsUrl("https://evil.example/file.svg")).rejects.toBeInstanceOf(UnsafeRemoteUrlError);
    await expect(assertSafePublicHttpsUrl("file:///etc/passwd")).rejects.toBeInstanceOf(UnsafeRemoteUrlError);
  });

  it("sniffs svg and rejects mismatched bytes", () => {
    const svg = Buffer.from(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>`);
    expect(sniffImageType(svg, "image/svg+xml").mimeType).toBe("image/svg+xml");
    expect(() => sniffImageType(Buffer.from("<html>nope</html>"), "text/html")).toThrow(/permitted image type/);
  });

  it("strips executable svg content", () => {
    const clean = sanitizeSvg(`<svg><script>alert(1)</script><rect /></svg>`);
    expect(clean).not.toMatch(/script/i);
  });
});

describe("catalog artwork policy", () => {
  it("does not treat catalog tiles as locked admin uploads", () => {
    expect(
      adminArtworkLocked([
        { storedName: "catalog-psn-store.svg", mimeType: "image/svg+xml", url: "/catalog/psn-store.svg" },
      ]),
    ).toBe(false);
  });

  it("preserves admin jpeg/png uploads", () => {
    expect(
      adminArtworkLocked([{ storedName: "171-abcdef.png", mimeType: "image/png", url: "/api/media/171-abcdef.png" }]),
    ).toBe(true);
  });

  it("preserves supplier category artwork from 1Epin", () => {
    expect(
      adminArtworkLocked([
        {
          storedName: "catalog-steam-wallet.webp",
          mimeType: "image/webp",
          url: "/catalog/steam-wallet.webp",
          artworkKind: "supplier-category",
        },
      ]),
    ).toBe(true);
  });

  it("marks catalog stored names", () => {
    expect(isCatalogManagedStoredName("catalog-pubg-uc.svg")).toBe(true);
    expect(isCatalogManagedStoredName("171-abcdef.png")).toBe(false);
  });

  it("builds name-only tiles without fake denominations", () => {
    const source = artworkForProduct("free-fire");
    expect(source?.kind).toBe("name-only-tile");
    const svg = nameOnlyTile(source!);
    expect(svg).toContain("Free Fire Diamonds");
    expect(svg).not.toMatch(/\$50|\$10|GIFT CARD/i);
  });

  it("wraps a permitted logo without claiming a face value", () => {
    const source = artworkForProduct("steam-wallet");
    const { svg, usedLogo } = buildIdentificationTile(source!, `<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>`);
    expect(usedLogo).toBe(true);
    expect(svg).toContain("data:image/svg+xml;base64,");
    expect(svg).not.toMatch(/\$50/);
  });
});

describe("copy and price preservation", () => {
  it("copy patches do not include selling prices", () => {
    const product = PRODUCTS[0];
    const patch = JSON.stringify(copyPatchFromProduct(product));
    expect(patch).not.toMatch(/priceFils|priceJod|compareAt/);
    expect(copyPatchFromProduct(product).en.shortDescription.length).toBeGreaterThan(8);
  });

  it("rejects accidental variant price writes", () => {
    expect(() =>
      assertNoPriceWrites([{ model: "productVariant", action: "update", data: { priceFils: 8900 } }]),
    ).toThrow(/must not write variant prices/);
    expect(() => assertNoPriceWrites([{ model: "product", action: "update", data: { brand: "Steam" } }])).not.toThrow();
  });

  it("does not describe Roblox as a direct Robux top-up", () => {
    const roblox = PRODUCTS.find((item) => item.id === "roblox-card");
    expect(roblox?.fulfillmentType).toBe("code");
    expect(roblox?.shortDescription).not.toMatch(/official-style/i);
    expect(roblox?.shortDescription).toMatch(/redeemable PIN|gift-card PIN|gift card PIN/i);
    expect(roblox?.description).not.toMatch(/direct Robux top-up/i);
  });

  it("keeps PUBG as a Player ID top-up", () => {
    const pubg = PRODUCTS.find((item) => item.id === "pubg-uc");
    expect(pubg?.fulfillmentType).toBe("direct_topup");
    expect(pubg?.digitalOptions.requiredCustomerFields.some((field) => field.id === "playerId")).toBe(true);
    expect(pubg?.description).not.toMatch(/Phase 2/i);
    expect(pubg?.digitalOptions.regions[0]?.name).not.toBe("Global");
  });
});
