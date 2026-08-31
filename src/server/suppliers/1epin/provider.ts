import {
  SupplierError,
  type SupplierBalance,
  type SupplierCategory,
  type SupplierCategoryDetails,
  type SupplierConnectionResult,
  type SupplierOrderInput,
  type SupplierOrderResult,
  type SupplierOrderStatus,
  type SupplierProduct,
  type SupplierProvider,
} from "@/server/suppliers/types";
import { resolveOneEpinConfig, LIVE_DISABLED_MESSAGE } from "@/server/suppliers/1epin/config";
import { OneEpinClient, type OneEpinClientOptions } from "@/server/suppliers/1epin/client";
import { mapOrderStatusCode } from "@/server/suppliers/1epin/types";
import { OneEpinConfigError } from "@/server/suppliers/1epin/errors";

export class OneEpinProvider implements SupplierProvider {
  constructor(
    private readonly client?: OneEpinClient,
    private readonly options?: OneEpinClientOptions,
  ) {}

  private resolveClient() {
    if (this.client) return this.client;
    try {
      return new OneEpinClient(resolveOneEpinConfig(), this.options);
    } catch (error) {
      const message = error instanceof OneEpinConfigError ? error.message : "1Epin is not configured.";
      throw new SupplierError(message, message === LIVE_DISABLED_MESSAGE ? "LIVE_DISABLED" : "NOT_CONFIGURED");
    }
  }

  async checkConnection(): Promise<SupplierConnectionResult> {
    const client = this.resolveClient();
    const balance = await client.checkBalance();
    return {
      ok: balance.resultCode === "00",
      mode: "test",
      message: balance.resultMessage || "1Epin test connection succeeded.",
    };
  }

  async getBalance(): Promise<SupplierBalance> {
    const result = await this.resolveClient().checkBalance();
    return { amount: result.balance, currency: result.currency, asOf: new Date().toISOString() };
  }

  async getCategories(): Promise<SupplierCategory[]> {
    const rows = await this.resolveClient().categoryInfo();
    return rows.map((item) => ({ externalId: item.categoryId, name: item.categoryName }));
  }

  async getCategoryDetails(externalCategoryId: string): Promise<SupplierCategoryDetails> {
    const detail = await this.resolveClient().categoryDetail(externalCategoryId);
    const products = await this.resolveClient().products(externalCategoryId).catch(() => []);
    return { externalId: detail.categoryId, name: detail.categoryName, products: products.length };
  }

  async getProducts(): Promise<SupplierProduct[]> {
    const rows = await this.resolveClient().allProducts();
    return rows.map((item) => ({
      externalId: item.productId,
      name: item.productName,
      categoryId: item.categoryId ?? "",
      price: item.price,
      currency: this.client ? undefined : undefined,
    }));
  }

  async placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult> {
    const user = input.playerFields.playerId ?? input.playerFields.userId ?? input.playerFields.user;
    const result = await this.resolveClient().addOrder({
      productId: input.externalProductId,
      orderNumber: input.idempotencyKey,
      quantity: input.quantity,
      user,
    });
    return {
      externalOrderNumber: result.orderNumber,
      status: "PROCESSING",
      message: result.resultMessage,
    };
  }

  async checkOrder(externalOrderNumber: string): Promise<SupplierOrderStatus> {
    const result = await this.resolveClient().checkOrder(externalOrderNumber);
    return {
      externalOrderNumber,
      status: mapOrderStatusCode(result.orderStatusCode),
      message: result.orderStatusMessage || result.resultMessage,
    };
  }
}

export function createTestOneEpinProvider(client: OneEpinClient) {
  return new OneEpinProvider(client);
}
