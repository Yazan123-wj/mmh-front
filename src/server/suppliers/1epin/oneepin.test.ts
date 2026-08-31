import { describe, expect, it, vi, beforeEach } from "vitest";
import { LIVE_DISABLED_MESSAGE, assertAllowedBaseUrl, assertLiveLocked, resolveOneEpinConfig, publicIntegrationStatus } from "@/server/suppliers/1epin/config";
import { ERROR_MAP, ONE_EPIN_CODES, errorInfo } from "@/server/suppliers/1epin/error-map";
import { OneEpinClient } from "@/server/suppliers/1epin/client";
import { OneEpinProvider } from "@/server/suppliers/1epin/provider";
import { getSupplierProvider, SupplierError } from "@/server/suppliers/provider";
import { redactDeep, redactText } from "@/server/suppliers/1epin/redaction";
import { callbackSchema } from "@/server/suppliers/1epin/schemas";
import { acceptCallback, tokensMatch, CALLBACK_OK } from "@/server/suppliers/1epin/callbacks";
import { mapOrderStatusCode } from "@/server/suppliers/1epin/types";
import { newSupplierRef, pinFingerprint } from "@/server/suppliers/1epin/store";
import { costDelta, supplierAmountToFils } from "@/server/suppliers/1epin/pricing";
import { resolveStorefrontPrice } from "@/server/pricing/calculate";
import { encryptSecret, decryptSecret, maskSecret } from "@/server/crypto/codes";
import { can, PERMISSIONS } from "@/server/auth/permissions";
import { assertCanCompleteFulfillment, assertSupplierFulfillmentGate } from "@/server/orders/fulfillment";
import { OneEpinApiError } from "@/server/suppliers/1epin/errors";
import { sanitizeAudit } from "@/server/audit-sanitize";
import type { OneEpinConfig } from "@/server/suppliers/1epin/config";

const prismaMock = vi.hoisted(() => ({
  supplier: { upsert: vi.fn() },
  supplierWebhookEvent: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  supplierOrder: { findUnique: vi.fn() },
  supplierConnection: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
}));

vi.mock("@/server/db", () => ({ prisma: prismaMock }));

function cfg(overrides: Partial<OneEpinConfig> = {}): OneEpinConfig {
  return {
    mode: "test",
    baseUrl: "https://www.1epin.com/api/test/",
    email: "user@example.test",
    password: "not-a-real-password",
    callbackToken: "callback-token-16x",
    timeoutMs: 800,
    localOrdersEnabled: false,
    currency: "USD",
    ...overrides,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("1Epin configuration", () => {
  it("rejects live mode", () => {
    expect(() => assertLiveLocked({ ONEEPIN_MODE: "live" })).toThrow(LIVE_DISABLED_MESSAGE);
    expect(() => assertLiveLocked({ ONEEPIN_ALLOW_LIVE: "true" })).toThrow(LIVE_DISABLED_MESSAGE);
    expect(() => assertLiveLocked({ SUPPLIER_MODE: "live" })).toThrow(LIVE_DISABLED_MESSAGE);
  });
  it("enforces HTTPS and host allowlisting", () => {
    expect(() => assertAllowedBaseUrl("http://www.1epin.com/api/test/")).toThrow(/HTTPS/);
    expect(() => assertAllowedBaseUrl("https://evil.example/api/test/")).toThrow(/allowlisted/);
    expect(() => assertAllowedBaseUrl("https://www.1epin.com/api/live/")).toThrow(LIVE_DISABLED_MESSAGE);
    expect(() => assertAllowedBaseUrl("https://www.1epin.com/api/other/")).toThrow(/test path/);
    expect(() => assertAllowedBaseUrl("https://www.1epin.com/api/test/")).not.toThrow();
  });
  it("requires credentials for resolved config", () => {
    expect(() =>
      resolveOneEpinConfig({
        ONEEPIN_MODE: "test",
        ONEEPIN_TEST_BASE_URL: "https://www.1epin.com/api/test/",
      }),
    ).toThrow(/not configured/);
  });
  it("reports configured vs not configured without secrets", () => {
    const status = publicIntegrationStatus({ ONEEPIN_MODE: "test" });
    expect(status.credentials).toBe("not_configured");
    expect(status.liveMode).toBe("locked");
    expect(JSON.stringify(status)).not.toMatch(/password/i);
  });
});

describe("1Epin error map", () => {
  it("covers every documented code 00-17", () => {
    for (const code of ONE_EPIN_CODES) {
      const info = errorInfo(code);
      expect(info.code).toBe(code);
      expect(info.adminMessage).not.toMatch(/Unknown error/i);
      expect(ERROR_MAP[code].retryable).toBeTypeOf("boolean");
    }
  });
  it("marks 07 as reconcile-not-retry", () => {
    expect(errorInfo("07").retryable).toBe(false);
    expect(errorInfo("07").action).toMatch(/checkOrder/);
  });
});

describe("1Epin client", () => {
  it("redacts credentials and PIN lists", () => {
    const redacted = redactDeep({ emailAddress: "a@b.c", password: "x", PinCodes: ["AAAA"] });
    expect(JSON.stringify(redacted)).not.toContain("a@b.c");
    expect(JSON.stringify(redacted)).not.toContain("AAAA");
    expect(redactText('"password":"x"')).toContain("[redacted]");
  });
  it("parses checkBalance", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ ResultCode: "00", ResultMessage: "Success", Balance: 12.5 }));
    const client = new OneEpinClient(cfg(), { fetch: fetchMock });
    const result = await client.checkBalance();
    expect(result.balance).toBe("12.5");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain("emailAddress");
  });
  it("parses categories, details, products, allProducts, localStocks", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("categoryDetail")) {
        return json({
          ResultCode: "00",
          ResultMessage: "Success",
          Category: { CategoryId: 131, CategoryName: "PUBG Mobile", CategoryType: "epin", CategoryImage: "https://example/a.jpg", CategoryDescription: "<p>ok</p><script>x</script>", CategoryUsage: "<p>use</p>" },
        });
      }
      if (String(url).includes("categories") || String(url).includes("categoryInfo")) {
        return json({ ResultCode: "00", ResultMessage: "Success", Categories: [{ CategoryId: 131, CategoryName: "PUBG Mobile", CategoryType: "epin" }] });
      }
      if (String(url).includes("allProducts") || String(url).includes("products") || String(url).includes("localStocks")) {
        return json({
          ResultCode: "00",
          ResultMessage: "Success",
          Products: [{ CategoryId: 131, CategoryName: "PUBG Mobile", CategoryType: "epin", ProductId: 28, ProductName: "PUBG Mobile 28 UC", ProductPrice: 6, StockQuantity: 4 }],
        });
      }
      return json({ ResultCode: "03", ResultMessage: "Wrong Username/Password", Balance: 0 });
    });
    const client = new OneEpinClient(cfg(), { fetch: fetchMock });
    expect((await client.categories())[0].categoryId).toBe("131");
    const detail = await client.categoryDetail("131");
    expect(detail.descriptionHtml).toContain("<p>ok</p>");
    expect(detail.descriptionHtml).not.toContain("script");
    expect((await client.products("131"))[0].productId).toBe("28");
    expect((await client.allProducts())[0].price).toBe("6");
    expect((await client.localStocks())[0].stockQuantity).toBe(4);
  });
  it("adds an order and checks status", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("addOrder")) return json({ ResultCode: "00", ResultMessage: "Success", Balance: 1 });
      return json({ ResultCode: "00", ResultMessage: "Success", OrderStatusCode: 0, OrderStatusMessage: "Processing", PinCodes: [], OrderAmount: 0 });
    });
    const client = new OneEpinClient(cfg(), { fetch: fetchMock });
    const added = await client.addOrder({ productId: "28", orderNumber: "TEP-A", quantity: 1 });
    expect(added.orderNumber).toBe("TEP-A");
    const checked = await client.checkOrder("TEP-A");
    expect(mapOrderStatusCode(checked.orderStatusCode)).toBe("PROCESSING");
  });
  it("does not retry addOrder on timeout", async () => {
    const fetchMock = vi.fn().mockImplementation(() => new Promise((_, reject) => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      reject(error);
    }));
    const client = new OneEpinClient(cfg({ timeoutMs: 20 }), { fetch: fetchMock, maxRetries: 2 });
    await expect(client.addOrder({ productId: "28", orderNumber: "TEP-B", quantity: 1 })).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("treats code 07 as a business error that must reconcile", async () => {
    const fetchMock = vi.fn().mockImplementation(() => json({ ResultCode: "07", ResultMessage: "Registered OrderNumber", Balance: 0 }));
    const client = new OneEpinClient(cfg(), { fetch: fetchMock });
    await expect(client.addOrder({ productId: "28", orderNumber: "TEP-C", quantity: 1 })).rejects.toBeInstanceOf(OneEpinApiError);
    await expect(client.addOrder({ productId: "28", orderNumber: "TEP-C", quantity: 1 })).rejects.toMatchObject({ resultCode: "07" });
  });
  it("handles malformed JSON and non-2xx", async () => {
    const bad = new OneEpinClient(cfg(), { fetch: vi.fn().mockResolvedValue(new Response("nope", { status: 200 })) });
    await expect(bad.checkBalance()).rejects.toMatchObject({ code: "MALFORMED" });
    const http = new OneEpinClient(cfg(), { fetch: vi.fn().mockResolvedValue(new Response("x", { status: 503 })), maxRetries: 0 });
    await expect(http.checkBalance()).rejects.toMatchObject({ code: "HTTP" });
  });
  it("validates responses with Zod", async () => {
    const client = new OneEpinClient(cfg(), { fetch: vi.fn().mockResolvedValue(json({ nope: true })) });
    await expect(client.checkBalance()).rejects.toMatchObject({ code: "INVALID" });
  });
  it("keeps local order methods disabled", () => {
    const client = new OneEpinClient(cfg());
    expect(() => client.addOrderLocal()).toThrow(/disabled/);
    expect(() => client.checkOrderLocal()).toThrow(/disabled/);
  });
});

describe("callbacks and order numbers", () => {
  it("rejects a guessed callback token without leaking closeness", () => {
    expect(tokensMatch("callback-token-16x", "callback-token-16y")).toBe(false);
    expect(tokensMatch("short", "callback-token-16x")).toBe(false);
    expect(tokensMatch("callback-token-16x", "callback-token-16x")).toBe(true);
  });
  it("validates callback schema and ignores PIN content in tests fixtures", () => {
    const parsed = callbackSchema.parse({
      OrderNumber: "TEP-1",
      OrderStatusCode: 1,
      OrderStatusMessage: "Completed",
      PinCodes: ["DEMO-NOT-A-REAL-PIN"],
      OrderAmount: 0.25,
    });
    expect(parsed.OrderNumber).toBe("TEP-1");
  });
  it("generates unique non-sequential supplier refs", () => {
    const a = newSupplierRef(true);
    const b = newSupplierRef(true);
    expect(a).toMatch(/^TEP-/);
    expect(a).not.toBe(b);
  });
});

describe("pricing and sync rules", () => {
  it("converts supplier amounts with integer math", () => {
    expect(supplierAmountToFils("10.00", 710000)).toBe(7100);
  });
  it("preserves manual overrides", () => {
    expect(
      resolveStorefrontPrice({ costFils: 1000, markupBps: 2200, currentPriceFils: 9999, manualPriceOverride: true }),
    ).toBe(9999);
  });
  it("does not auto-publish — drafts stay drafts", () => {
    expect(can("CATALOG_MANAGER", PERMISSIONS.catalogWrite)).toBe(true);
  });
});

describe("code encryption and RBAC", () => {
  it("encrypts fixtures and masks them", () => {
    process.env.CODE_ENCRYPTION_KEY = "ab".repeat(32);
    const enc = encryptSecret("DEMO-NOT-A-REAL-PIN");
    expect(decryptSecret(enc)).toBe("DEMO-NOT-A-REAL-PIN");
    expect(maskSecret("DEMO-NOT-A-REAL-PIN")).toContain("••••");
    expect(pinFingerprint("DEMO-NOT-A-REAL-PIN")).toHaveLength(64);
  });
  it("blocks unauthorized reveal roles", () => {
    expect(can("VIEWER", PERMISSIONS.codeReveal)).toBe(false);
    expect(can("SUPPORT_AGENT", PERMISSIONS.codeReveal)).toBe(false);
    expect(can("CATALOG_MANAGER", PERMISSIONS.integrationWrite)).toBe(false);
    expect(can("ADMIN", PERMISSIONS.integrationWrite)).toBe(true);
  });
  it("still blocks unpaid fulfillment for non-super-admins", () => {
    expect(() =>
      assertCanCompleteFulfillment({ paymentStatus: "PENDING", targetStatus: "COMPLETED", role: "ADMIN", reason: "no" }),
    ).toThrow(/Unpaid/);
  });
});

describe("provider factory lock", () => {
  it("OneEpinProvider throws without credentials", async () => {
    const previousEmail = process.env.ONEEPIN_EMAIL;
    const previousPassword = process.env.ONEEPIN_PASSWORD;
    delete process.env.ONEEPIN_EMAIL;
    delete process.env.ONEEPIN_PASSWORD;
    try {
      const provider = new OneEpinProvider();
      await expect(provider.checkConnection()).rejects.toBeInstanceOf(SupplierError);
    } finally {
      if (previousEmail !== undefined) process.env.ONEEPIN_EMAIL = previousEmail;
      if (previousPassword !== undefined) process.env.ONEEPIN_PASSWORD = previousPassword;
    }
  });
  it("rejects live supplier mode", () => {
    const previous = process.env.SUPPLIER_MODE;
    process.env.SUPPLIER_MODE = "live";
    try {
      expect(() => getSupplierProvider()).toThrow(LIVE_DISABLED_MESSAGE);
    } finally {
      if (previous === undefined) delete process.env.SUPPLIER_MODE;
      else process.env.SUPPLIER_MODE = previous;
    }
  });
});

describe("1Epin documented result codes", () => {
  it("surfaces every code 01-17 from the client without unknown-error wording", async () => {
    for (const code of ONE_EPIN_CODES.filter((item) => item !== "00")) {
      const client = new OneEpinClient(cfg(), {
        fetch: vi.fn().mockResolvedValue(json({ ResultCode: code, ResultMessage: "fixture", Balance: 0 })),
      });
      await expect(client.checkBalance()).rejects.toMatchObject({ resultCode: code });
      expect(errorInfo(code).adminMessage).not.toMatch(/Unknown error/i);
    }
  });
  it("does not retry documented business errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ ResultCode: "10", ResultMessage: "agreement window" }));
    const client = new OneEpinClient(cfg(), { fetch: fetchMock, maxRetries: 2 });
    await expect(client.checkBalance()).rejects.toMatchObject({ resultCode: "10" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("retries temporary HTTP 5xx on read endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("x", { status: 503 }))
      .mockResolvedValueOnce(json({ ResultCode: "00", ResultMessage: "Success", Balance: 3 }));
    const client = new OneEpinClient(cfg(), { fetch: fetchMock, maxRetries: 2 });
    expect((await client.checkBalance()).balance).toBe("3");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("omits barem unless provided", async () => {
    const fetchMock = vi.fn().mockImplementation(() => json({ ResultCode: "00", ResultMessage: "Success", Balance: 1 }));
    const client = new OneEpinClient(cfg(), { fetch: fetchMock });
    await client.addOrder({ productId: "28", orderNumber: "TEP-NO-BAREM", quantity: 1 });
    const body = String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body);
    expect(body).not.toContain("barem");
    await client.addOrder({ productId: "28", orderNumber: "TEP-BAREM", quantity: 1, barem: "50" });
    const withBarem = String((fetchMock.mock.calls[1] as [string, RequestInit])[1].body);
    expect(withBarem).toContain('"barem":50');
  });
  it("never logs PIN fixtures", async () => {
    const onLog = vi.fn();
    const client = new OneEpinClient(cfg(), {
      onLog,
      fetch: vi.fn().mockResolvedValue(
        json({
          ResultCode: "00",
          ResultMessage: "Success",
          OrderStatusCode: 1,
          OrderStatusMessage: "Completed",
          PinCodes: ["FIXTURE-NOT-A-REAL-PIN"],
          OrderAmount: 1,
        }),
      ),
    });
    const result = await client.checkOrder("TEP-PINS");
    expect(result.pinCodes).toEqual(["FIXTURE-NOT-A-REAL-PIN"]);
    expect(JSON.stringify(onLog.mock.calls)).not.toContain("FIXTURE-NOT-A-REAL-PIN");
  });
});

describe("fulfillment gates and test isolation", () => {
  it("blocks unpaid and live customer fulfillment", () => {
    expect(() =>
      assertSupplierFulfillmentGate({
        isTest: false,
        paymentStatus: "PENDING",
        productPublished: true,
        variantAvailable: true,
        mappingActive: true,
        alreadySubmitted: false,
      }),
    ).toThrow(/Unpaid/);
    expect(() =>
      assertSupplierFulfillmentGate({
        isTest: false,
        paymentStatus: "PAID",
        productPublished: true,
        variantAvailable: true,
        mappingActive: true,
        alreadySubmitted: false,
      }),
    ).toThrow(/payment integration/);
  });
  it("allows isolated test orders", () => {
    expect(() =>
      assertSupplierFulfillmentGate({
        isTest: true,
        paymentStatus: "PENDING",
        productPublished: false,
        variantAvailable: false,
        mappingActive: false,
        alreadySubmitted: false,
      }),
    ).not.toThrow();
  });
  it("computes supplier cost difference without floats for storefront fils", () => {
    expect(costDelta("6.00", "7.50").difference).toBe("1.5");
  });
  it("redacts PIN lists in audit JSON", () => {
    const sanitized = sanitizeAudit({ PinCodes: ["AAAA"], password: "x", action: "cb" }) as Record<string, unknown>;
    expect(sanitized.password).toBe("[redacted]");
    expect(JSON.stringify(sanitized)).not.toContain("AAAA");
  });
});

describe("callbacks", () => {
  const token = "callback-token-16x";
  const payload = {
    OrderNumber: "TEP-CB-1",
    OrderStatusCode: 1,
    OrderStatusMessage: "Completed",
    PinCodes: ["FIXTURE-NOT-A-REAL-PIN"],
    OrderAmount: 0.25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.supplier.upsert.mockResolvedValue({ id: "sup-1" });
    prismaMock.supplierConnection.findFirst.mockResolvedValue({ id: "conn-1" });
    prismaMock.supplierWebhookEvent.findUnique.mockResolvedValue(null);
    prismaMock.supplierWebhookEvent.findFirst.mockResolvedValue(null);
    prismaMock.supplierWebhookEvent.create.mockResolvedValue({ id: "evt-1" });
    prismaMock.supplierWebhookEvent.update.mockResolvedValue({});
    prismaMock.supplierOrder.findUnique.mockResolvedValue({ id: "so-1", supplierRef: "TEP-CB-1" });
    prismaMock.supplierConnection.updateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects an invalid token with a generic 404", async () => {
    const result = await acceptCallback({ token: "callback-token-16z", expectedToken: token, body: payload });
    expect(result).toEqual({ status: 404, body: "Not found" });
  });
  it("rejects an invalid schema", async () => {
    const result = await acceptCallback({ token, expectedToken: token, body: { nope: true } });
    expect(result.status).toBe(400);
  });
  it("requires an existing supplier order number", async () => {
    prismaMock.supplierOrder.findUnique.mockResolvedValue(null);
    const result = await acceptCallback({ token, expectedToken: token, body: payload });
    expect(result.status).toBe(404);
  });
  it("accepts a valid callback with OK and does not trust PIN codes", async () => {
    const result = await acceptCallback({ token, expectedToken: token, body: payload, client: null });
    expect(result.body).toBe(CALLBACK_OK);
    expect(result.status).toBe(200);
    const stored = prismaMock.supplierWebhookEvent.create.mock.calls[0][0].data.payloadRedacted as Record<string, unknown>;
    expect(JSON.stringify(stored)).not.toContain("FIXTURE-NOT-A-REAL-PIN");
  });
  it("is idempotent for duplicate payloads", async () => {
    prismaMock.supplierWebhookEvent.findUnique.mockResolvedValue({ id: "existing" });
    const result = await acceptCallback({ token, expectedToken: token, body: payload });
    expect(result).toMatchObject({ status: 200, body: CALLBACK_OK, duplicate: true });
    expect(prismaMock.supplierWebhookEvent.create).not.toHaveBeenCalled();
  });
  it("preserves conflicting payloads for review", async () => {
    prismaMock.supplierWebhookEvent.findFirst.mockResolvedValue({ id: "prior" });
    const result = await acceptCallback({ token, expectedToken: token, body: payload, client: null });
    expect(result).toMatchObject({ status: 200, body: CALLBACK_OK, conflict: true });
    expect(prismaMock.supplierWebhookEvent.create.mock.calls[0][0].data.conflict).toBe(true);
  });
});
