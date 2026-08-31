import { percentOfFils } from "@/server/money";

export function sellingPriceFromCost(costFils: number, markupBps: number): number {
  if (!Number.isInteger(costFils) || !Number.isInteger(markupBps)) throw new Error("Integer required");
  return costFils + percentOfFils(costFils, markupBps);
}

export function resolveStorefrontPrice(input: {
  costFils: number;
  markupBps: number;
  currentPriceFils: number;
  manualPriceOverride: boolean;
}): number {
  if (input.manualPriceOverride) return input.currentPriceFils;
  return sellingPriceFromCost(input.costFils, input.markupBps);
}

export function belowMinimumMargin(priceFils: number, costFils: number, minMarginBps: number): boolean {
  if (priceFils <= 0) return true;
  const profit = priceFils - costFils;
  return profit * 10000 < priceFils * minMarginBps;
}
