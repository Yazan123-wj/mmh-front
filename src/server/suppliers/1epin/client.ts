import { nanoid } from "nanoid";
import { z, type ZodType } from "zod";
import type { OneEpinConfig } from "@/server/suppliers/1epin/config";
import { fromResultCode, OneEpinApiError } from "@/server/suppliers/1epin/errors";
import { errorInfo, isRetryableHttp } from "@/server/suppliers/1epin/error-map";
import { redactDeep, redactText } from "@/server/suppliers/1epin/redaction";
import {
  addOrderResponseSchema,
  balanceResponseSchema,
  categoriesResponseSchema,
  categoryDetailResponseSchema,
  checkOrderResponseSchema,
  productsResponseSchema,
} from "@/server/suppliers/1epin/schemas";
import type {
  OneEpinAddOrderInput,
  OneEpinAddOrderResult,
  OneEpinBalanceResult,
  OneEpinCategory,
  OneEpinCheckOrderResult,
  OneEpinProduct,
  OneEpinRequestMeta,
} from "@/server/suppliers/1epin/types";
import { sanitizeRichText } from "@/server/html";

const READ_ENDPOINTS = new Set([
  "checkBalance",
  "categories",
  "categoryInfo",
  "categoryDetail",
  "products",
  "allProducts",
  "checkOrder",
  "localStocks",
]);

export interface OneEpinLogEvent {
  action: string;
  ok: boolean;
  statusCode?: number;
  resultCode?: string;
  message: string;
  correlationId: string;
  durationMs: number;
  retryCount: number;
}

export interface OneEpinClientOptions {
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  onLog?: (event: OneEpinLogEvent) => void | Promise<void>;
  maxRetries?: number;
}

export class OneEpinClient {
  constructor(
    private readonly config: OneEpinConfig,
    private readonly options: OneEpinClientOptions = {},
  ) {}

  async checkBalance(): Promise<OneEpinBalanceResult> {
    const body = await this.request("checkBalance", {}, balanceResponseSchema, true);
    return {
      resultCode: body.ResultCode,
      resultMessage: body.ResultMessage,
      balance: String(body.Balance),
      currency: this.config.currency,
      meta: this.lastMeta,
    };
  }

  async categories(): Promise<OneEpinCategory[]> {
    const body = await this.read("categories", {}, categoriesResponseSchema);
    return (body.Categories ?? []).map((item) => this.mapCategory(item));
  }

  async categoryInfo(): Promise<OneEpinCategory[]> {
    const body = await this.read("categoryInfo", {}, categoriesResponseSchema);
    return (body.Categories ?? []).map((item) => this.mapCategory(item));
  }

  async categoryDetail(categoryId: string): Promise<OneEpinCategory> {
    const body = await this.read("categoryDetail", { category: Number(categoryId) }, categoryDetailResponseSchema);
    if (!body.Category) throw fromResultCode(body.ResultCode === "00" ? "05" : body.ResultCode, this.lastMeta.correlationId);
    return this.mapCategory(body.Category);
  }

  async products(categoryId: string): Promise<OneEpinProduct[]> {
    const body = await this.read("products", { category: Number(categoryId) }, productsResponseSchema);
    return (body.Products ?? []).map((item) => this.mapProduct(item, categoryId));
  }

  async allProducts(): Promise<OneEpinProduct[]> {
    const body = await this.read("allProducts", {}, productsResponseSchema);
    return (body.Products ?? []).map((item) => this.mapProduct(item));
  }

  async localStocks(): Promise<OneEpinProduct[]> {
    const body = await this.read("localStocks", {}, productsResponseSchema);
    return (body.Products ?? []).map((item) => this.mapProduct(item));
  }

  async addOrder(input: OneEpinAddOrderInput): Promise<OneEpinAddOrderResult> {
    const payload: Record<string, unknown> = {
      product: Number(input.productId),
      orderNumber: input.orderNumber,
    };
    if (input.user) payload.user = input.user;
    if (input.quantity != null) payload.quantity = input.quantity;
    if (input.barem) payload.barem = Number(input.barem);
    const body = await this.write("addOrder", payload, addOrderResponseSchema);
    return {
      resultCode: body.ResultCode,
      resultMessage: body.ResultMessage,
      balance: body.Balance != null ? String(body.Balance) : undefined,
      orderNumber: input.orderNumber,
      meta: this.lastMeta,
    };
  }

  async checkOrder(orderNumber: string): Promise<OneEpinCheckOrderResult> {
    const body = await this.read("checkOrder", { orderNumber }, checkOrderResponseSchema);
    return {
      resultCode: body.ResultCode,
      resultMessage: body.ResultMessage,
      orderNumber,
      orderStatusCode: Number(body.OrderStatusCode),
      orderStatusMessage: body.OrderStatusMessage,
      pinCodes: body.PinCodes ?? [],
      orderAmount: body.OrderAmount != null ? String(body.OrderAmount) : undefined,
      meta: this.lastMeta,
    };
  }

  addOrderLocal(): never {
    throw new OneEpinApiError("addOrderLocal is disabled. Use addOrder.", "DISABLED", "local", false);
  }

  checkOrderLocal(): never {
    throw new OneEpinApiError("checkOrderLocal is disabled. Use checkOrder.", "DISABLED", "local", false);
  }

  private lastMeta: OneEpinRequestMeta = { correlationId: "", durationMs: 0, retryCount: 0 };

  private mapCategory(item: {
    CategoryId: string | number;
    CategoryName: string;
    CategoryType?: string;
    CategoryImage?: string;
    CategoryDescription?: string;
    CategoryUsage?: string;
  }): OneEpinCategory {
    return {
      categoryId: String(item.CategoryId),
      categoryName: item.CategoryName,
      categoryType: item.CategoryType ?? "",
      imageUrl: item.CategoryImage,
      descriptionHtml: item.CategoryDescription ? sanitizeRichText(item.CategoryDescription) : undefined,
      usageHtml: item.CategoryUsage ? sanitizeRichText(item.CategoryUsage) : undefined,
    };
  }

  private mapProduct(item: {
    ProductId: string | number;
    ProductName: string;
    ProductPrice?: string | number;
    CategoryId?: string | number;
    CategoryName?: string;
    CategoryType?: string;
    StockQuantity?: string | number;
  }, fallbackCategory?: string): OneEpinProduct {
    return {
      productId: String(item.ProductId),
      productName: item.ProductName,
      price: item.ProductPrice != null ? String(item.ProductPrice) : "0",
      categoryId: item.CategoryId != null ? String(item.CategoryId) : fallbackCategory,
      categoryName: item.CategoryName,
      categoryType: item.CategoryType,
      stockQuantity: item.StockQuantity != null ? Number(item.StockQuantity) : undefined,
    };
  }

  private read<S extends ZodType>(endpoint: string, extra: Record<string, unknown>, schema: S) {
    return this.request(endpoint, extra, schema, true);
  }

  private write<S extends ZodType>(endpoint: string, extra: Record<string, unknown>, schema: S) {
    return this.request(endpoint, extra, schema, false);
  }

  private async request<S extends ZodType>(
    endpoint: string,
    extra: Record<string, unknown>,
    schema: S,
    retryable: boolean,
  ): Promise<z.output<S>> {
    const correlationId = `epn_${nanoid(12)}`;
    const started = Date.now();
    const maxRetries = retryable && READ_ENDPOINTS.has(endpoint) ? (this.options.maxRetries ?? 2) : 0;
    let attempt = 0;
    let lastError: unknown;
    while (attempt <= maxRetries) {
      try {
        const result = await this.once(endpoint, extra, schema, correlationId, attempt);
        this.lastMeta = { ...result.meta, durationMs: Date.now() - started, retryCount: attempt };
        const coded = result.body as { ResultCode?: string; ResultMessage?: string };
        await this.options.onLog?.({
          action: endpoint,
          ok: coded.ResultCode ? coded.ResultCode === "00" : result.meta.httpStatus === 200,
          statusCode: result.meta.httpStatus,
          resultCode: coded.ResultCode,
          message: coded.ResultMessage ?? "ok",
          correlationId,
          durationMs: this.lastMeta.durationMs,
          retryCount: attempt,
        });
        if (coded.ResultCode && coded.ResultCode !== "00") {
          const info = errorInfo(coded.ResultCode);
          throw new OneEpinApiError(info.adminMessage, coded.ResultCode, correlationId, false, result.meta.httpStatus);
        }
        return result.body;
      } catch (error) {
        lastError = error;
        const retryHttp =
          error instanceof OneEpinApiError &&
          error.httpStatus != null &&
          isRetryableHttp(error.httpStatus) &&
          retryable &&
          READ_ENDPOINTS.has(endpoint);
        const retryNetwork =
          retryable &&
          READ_ENDPOINTS.has(endpoint) &&
          error instanceof OneEpinApiError &&
          (error.code === "TIMEOUT" || error.code === "NETWORK" || error.code === "HTTP");
        if (attempt < maxRetries && (retryHttp || retryNetwork)) {
          attempt += 1;
          continue;
        }
        if (error instanceof OneEpinApiError) {
          await this.options.onLog?.({
            action: endpoint,
            ok: false,
            statusCode: error.httpStatus,
            resultCode: error.resultCode,
            message: error.message,
            correlationId,
            durationMs: Date.now() - started,
            retryCount: attempt,
          });
        }
        throw error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("1Epin request failed.");
  }

  private async once<S extends ZodType>(
    endpoint: string,
    extra: Record<string, unknown>,
    schema: S,
    correlationId: string,
    retryCount: number,
  ) {
    const url = `${this.config.baseUrl}${endpoint}/`;
    const payload = {
      emailAddress: this.config.email,
      password: this.config.password,
      ...extra,
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    const started = Date.now();
    try {
      const fetchFn = this.options.fetch ?? fetch;
      const response = await fetchFn(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Correlation-Id": correlationId },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const rawText = await response.text();
      void redactDeep(payload);
      void redactText(rawText);
      if (!response.ok) {
        throw new OneEpinApiError(
          `1Epin HTTP ${response.status}`,
          "HTTP",
          correlationId,
          isRetryableHttp(response.status),
          response.status,
        );
      }
      let json: unknown;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new OneEpinApiError("1Epin returned malformed JSON.", "MALFORMED", correlationId, false, response.status);
      }
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new OneEpinApiError("1Epin response failed validation.", "INVALID", correlationId, false, response.status);
      }
      return {
        body: parsed.data,
        meta: {
          correlationId,
          durationMs: Date.now() - started,
          retryCount,
          httpStatus: response.status,
          resultCode: (parsed.data as { ResultCode?: string }).ResultCode,
        } satisfies OneEpinRequestMeta,
      };
    } catch (error) {
      if (error instanceof OneEpinApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new OneEpinApiError("1Epin request timed out.", "TIMEOUT", correlationId, true);
      }
      throw new OneEpinApiError("1Epin is unavailable.", "NETWORK", correlationId, true);
    } finally {
      clearTimeout(timer);
    }
  }
}

export function createOneEpinClient(config: OneEpinConfig, options?: OneEpinClientOptions) {
  return new OneEpinClient(config, options);
}
