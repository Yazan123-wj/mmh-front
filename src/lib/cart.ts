import { getProductById } from "@/data/products";
import type { CartItem, Product } from "@/types";

export function resolveCartProduct(item: CartItem): Product | undefined {
  return getProductById(item.productId);
}

export function linePrice(item: CartItem, product: Product): number {
  if (item.digital) {
    const denomination = product.digitalOptions.denominations.find(
      (entry) => entry.id === item.digital?.denominationId,
    );
    if (denomination) return denomination.priceJod * item.quantity;
  }
  return product.priceJod * item.quantity;
}

export function cartHasRegionLocked(items: CartItem[]): boolean {
  return items.some((item) => {
    const product = getProductById(item.productId);
    return Boolean(product?.digitalOptions.regions.some((region) => region.locked));
  });
}

export function maskAccountValue(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `${trimmed.slice(0, 2)}••••${trimmed.slice(-2)}`;
}

export const DEMO_CODE = "XXXX-XXXX-XXXX";
export const DEMO_CODE_REVEALED = "DEMO-XXXX-XXXX";
