export interface OneEpinRequestMeta {
  correlationId: string;
  durationMs: number;
  retryCount: number;
  httpStatus?: number;
  resultCode?: string;
}

export interface OneEpinBalanceResult {
  resultCode: string;
  resultMessage: string;
  balance: string;
  currency: string;
  meta: OneEpinRequestMeta;
}

export interface OneEpinCategory {
  categoryId: string;
  categoryName: string;
  categoryType: string;
  imageUrl?: string;
  descriptionHtml?: string;
  usageHtml?: string;
}

export interface OneEpinProduct {
  productId: string;
  productName: string;
  price: string;
  categoryId?: string;
  categoryName?: string;
  categoryType?: string;
  stockQuantity?: number;
}

export interface OneEpinAddOrderInput {
  productId: string;
  orderNumber: string;
  quantity?: number;
  user?: string;
  barem?: string;
}

export interface OneEpinAddOrderResult {
  resultCode: string;
  resultMessage: string;
  balance?: string;
  orderNumber: string;
  meta: OneEpinRequestMeta;
}

export interface OneEpinCheckOrderResult {
  resultCode: string;
  resultMessage: string;
  orderNumber: string;
  orderStatusCode: number;
  orderStatusMessage: string;
  pinCodes: string[];
  orderAmount?: string;
  meta: OneEpinRequestMeta;
}

export type InternalSupplierStatus = "PROCESSING" | "COMPLETED" | "FAILED" | "UNKNOWN";

export function mapOrderStatusCode(code: number): InternalSupplierStatus {
  if (code === 0) return "PROCESSING";
  if (code === 1) return "COMPLETED";
  if (code === 2) return "FAILED";
  return "UNKNOWN";
}
