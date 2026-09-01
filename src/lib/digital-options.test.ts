import { describe, expect, it } from "vitest";
import { defaultRegionId, denominationsForRegion, matchDenominationId, uniqueFaceValues } from "@/lib/digital-options";
import { PRODUCTS } from "@/data/products";
import type { DigitalDenomination, Product } from "@/types";

function withVariants(product: Product, extra: DigitalDenomination[]): Product {
  return {
    ...product,
    digitalOptions: { ...product.digitalOptions, denominations: extra },
  };
}

describe("digital option visibility", () => {
  it("keeps unique fallback denominations unchanged", () => {
    const steam = PRODUCTS.find((item) => item.id === "steam-wallet")!;
    expect(uniqueFaceValues(steam.digitalOptions.denominations)).toHaveLength(3);
    expect(denominationsForRegion(steam, "eu")).toHaveLength(3);
  });

  it("shows one amount per selected region instead of repeating variants", () => {
    const steam = PRODUCTS.find((item) => item.id === "steam-wallet")!;
    const duplicated: DigitalDenomination[] = steam.digitalOptions.denominations.flatMap((item) => [
      { ...item, id: `${item.id}-us`, regionId: "us" },
      { ...item, id: `${item.id}-eu`, regionId: "eu", currency: "EUR" },
    ]);
    const product = withVariants(steam, duplicated);
    expect(denominationsForRegion(product, "eu").map((item) => item.id)).toEqual(["10-eu", "20-eu", "50-eu"]);
    expect(matchDenominationId(product, "eu", "10-us")).toBe("10-eu");
  });

  it("defaults to UAE/MENA when available", () => {
    const psn = PRODUCTS.find((item) => item.id === "psn-store")!;
    expect(defaultRegionId(psn.digitalOptions.regions)).toBe("uae");
  });
});
