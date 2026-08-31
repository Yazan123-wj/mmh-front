export class SupplierError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = "SupplierError";
  }
}

export interface SupplierConnectionResult {
  ok: boolean;
  mode: "mock" | "test" | "live";
  message: string;
}

export interface SupplierBalance {
  amount: string;
  currency: string;
  asOf: string;
}

export interface SupplierCategory {
  externalId: string;
  name: string;
}

export interface SupplierCategoryDetails extends SupplierCategory {
  products: number;
}

export interface SupplierProduct {
  externalId: string;
  name: string;
  categoryId: string;
  price?: string;
  currency?: string;
}

export interface SupplierOrderInput {
  idempotencyKey: string;
  externalProductId: string;
  quantity: number;
  playerFields: Record<string, string>;
}

export interface SupplierOrderResult {
  externalOrderNumber: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  message: string;
}

export interface SupplierOrderStatus {
  externalOrderNumber: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED" | "UNKNOWN";
  message: string;
}

export interface SupplierProvider {
  checkConnection(): Promise<SupplierConnectionResult>;
  getBalance(): Promise<SupplierBalance>;
  getCategories(): Promise<SupplierCategory[]>;
  getCategoryDetails(externalCategoryId: string): Promise<SupplierCategoryDetails>;
  getProducts(): Promise<SupplierProduct[]>;
  placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult>;
  checkOrder(externalOrderNumber: string): Promise<SupplierOrderStatus>;
}
