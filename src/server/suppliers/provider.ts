import { SupplierError, type SupplierProvider } from "@/server/suppliers/types";
import { OneEpinProvider } from "@/server/suppliers/1epin/provider";
import { LIVE_DISABLED_MESSAGE } from "@/server/suppliers/1epin/config";
import type {
  SupplierBalance,
  SupplierCategory,
  SupplierCategoryDetails,
  SupplierConnectionResult,
  SupplierOrderInput,
  SupplierOrderResult,
  SupplierOrderStatus,
  SupplierProduct,
} from "@/server/suppliers/types";

export { SupplierError, OneEpinProvider };
export type {
  SupplierBalance,
  SupplierCategory,
  SupplierCategoryDetails,
  SupplierConnectionResult,
  SupplierOrderInput,
  SupplierOrderResult,
  SupplierOrderStatus,
  SupplierProduct,
  SupplierProvider,
};

export class MockSupplierProvider implements SupplierProvider {
  async checkConnection(): Promise<SupplierConnectionResult> {
    return { ok: true, mode: "mock", message: "Mock Mode — 1Epin is not live." };
  }
  async getBalance(): Promise<SupplierBalance> {
    return { amount: "0.00", currency: "USD", asOf: new Date().toISOString() };
  }
  async getCategories(): Promise<SupplierCategory[]> {
    return [
      { externalId: "mock-psn", name: "PlayStation" },
      { externalId: "mock-pubg", name: "PUBG Mobile" },
      { externalId: "mock-roblox", name: "Roblox" },
    ];
  }
  async getCategoryDetails(externalCategoryId: string): Promise<SupplierCategoryDetails> {
    const found = (await this.getCategories()).find((item) => item.externalId === externalCategoryId);
    if (!found) throw new SupplierError("Unknown mock category", "NOT_FOUND");
    return { ...found, products: 4 };
  }
  async getProducts(): Promise<SupplierProduct[]> {
    return [
      { externalId: "1epin-psn-50", name: "PSN 50", categoryId: "mock-psn", price: "50.00", currency: "USD" },
      { externalId: "1epin-pubg-1800", name: "PUBG 1800 UC", categoryId: "mock-pubg", price: "22.90", currency: "USD" },
      { externalId: "1epin-roblox-25", name: "Roblox 25", categoryId: "mock-roblox", price: "25.00", currency: "USD" },
    ];
  }
  async placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult> {
    return {
      externalOrderNumber: `MOCK-${input.idempotencyKey.slice(0, 8)}`,
      status: "PROCESSING",
      message: "Mock Mode — order was not sent to 1Epin.",
    };
  }
  async checkOrder(externalOrderNumber: string): Promise<SupplierOrderStatus> {
    return { externalOrderNumber, status: "PROCESSING", message: "Mock Mode" };
  }
}

export function getSupplierProvider(): SupplierProvider {
  const mode = process.env.SUPPLIER_MODE ?? "mock";
  if (mode === "live") {
    throw new SupplierError(LIVE_DISABLED_MESSAGE, "LIVE_DISABLED");
  }
  if (mode === "test") return new OneEpinProvider();
  return new MockSupplierProvider();
}
