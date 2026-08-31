import { describe, expect, it } from "vitest";
import { addFils, filsToJod, formatFils, jodToFils, marginBps, multiplyFils, percentOfFils } from "@/server/money";
import { can, PERMISSIONS } from "@/server/auth/permissions";
import { MockSupplierProvider, OneEpinProvider, SupplierError } from "@/server/suppliers/provider";
import { validatePasswordStrength } from "@/server/auth/password";
import { encryptSecret, decryptSecret, maskSecret } from "@/server/crypto/codes";
import { validateImageUpload } from "@/server/image";
import { assertCanCompleteFulfillment } from "@/server/orders/fulfillment";
import { belowMinimumMargin, resolveStorefrontPrice, sellingPriceFromCost } from "@/server/pricing/calculate";
import { isStorefrontVisible } from "@/server/catalog/visibility";
import { pickLocalized } from "@/server/i18n";
import { sanitizeAudit } from "@/server/audit-sanitize";
import { sanitizeRichText } from "@/server/html";

describe("JOD fils conversion", () => {
  it("converts 1 JOD to 1000 fils", () => {
    expect(jodToFils(1)).toBe(1000);
    expect(filsToJod(1000)).toBe(1);
  });
  it("keeps 3 decimal fils", () => {
    expect(jodToFils(39.9)).toBe(39900);
    expect(formatFils(39900)).toBe("39.9");
  });
  it("multiplies without floats", () => {
    expect(multiplyFils(39900, 2)).toBe(79800);
    expect(addFils(1000, 250)).toBe(1250);
  });
  it("computes margin in basis points", () => {
    expect(marginBps(10000, 7800)).toBe(2200);
    expect(percentOfFils(10000, 2200)).toBe(2200);
  });
});

describe("order totals", () => {
  it("sums line items in fils", () => {
    const lines = [
      { priceFils: 39900, quantity: 2 },
      { priceFils: 12500, quantity: 1 },
    ];
    const total = addFils(...lines.map((line) => multiplyFils(line.priceFils, line.quantity)));
    expect(total).toBe(92300);
    expect(filsToJod(total)).toBe(92.3);
  });
});

describe("RBAC", () => {
  it("allows super admin unpaid fulfillment", () => {
    expect(can("SUPER_ADMIN", PERMISSIONS.orderFulfillUnpaid)).toBe(true);
    expect(can("ADMIN", PERMISSIONS.orderFulfillUnpaid)).toBe(false);
    expect(can("VIEWER", PERMISSIONS.catalogWrite)).toBe(false);
    expect(can("SUPPORT_AGENT", PERMISSIONS.codeReveal)).toBe(false);
    expect(can("ORDER_MANAGER", PERMISSIONS.codeReveal)).toBe(true);
    expect(can("CATALOG_MANAGER", PERMISSIONS.orderWrite)).toBe(false);
  });
});

describe("password policy", () => {
  it("rejects weak passwords", () => {
    expect(validatePasswordStrength("short")).toBeTruthy();
    expect(validatePasswordStrength("LongEnoughPass1!")).toBeNull();
  });
});

describe("digital code crypto", () => {
  it("round-trips and masks", () => {
    process.env.CODE_ENCRYPTION_KEY = "ab".repeat(32);
    const enc = encryptSecret("DEMO-XXXX-XXXX");
    expect(decryptSecret(enc)).toBe("DEMO-XXXX-XXXX");
    expect(maskSecret("DEMO-XXXX-XXXX")).toContain("••••");
    expect(enc.ciphertext).not.toContain("DEMO");
  });
});

describe("supplier adapters", () => {
  it("uses mock mode without live calls", async () => {
    const mock = new MockSupplierProvider();
    const result = await mock.checkConnection();
    expect(result.mode).toBe("mock");
    expect(result.ok).toBe(true);
  });
  it("blocks the 1Epin placeholder", async () => {
    const live = new OneEpinProvider();
    await expect(live.checkConnection()).rejects.toBeInstanceOf(SupplierError);
  });
});

describe("image validation", () => {
  it("rejects executable and oversized files", () => {
    expect(() => validateImageUpload({ mimeType: "text/html", size: 100, originalName: "x.html" })).toThrow();
    expect(() => validateImageUpload({ mimeType: "image/png", size: 6 * 1024 * 1024, originalName: "x.png" })).toThrow();
  });
  it("accepts a valid PNG name and type", () => {
    const buffer = Buffer.alloc(32);
    buffer.writeUInt32BE(256, 16);
    buffer.writeUInt32BE(256, 20);
    expect(() =>
      validateImageUpload({ mimeType: "image/png", size: buffer.length, originalName: "card.png", buffer }),
    ).not.toThrow();
  });
});

describe("unpaid fulfillment", () => {
  it("blocks non-super-admins from completing unpaid orders", () => {
    expect(() =>
      assertCanCompleteFulfillment({
        paymentStatus: "PENDING",
        targetStatus: "COMPLETED",
        role: "ADMIN",
        reason: "manual",
      }),
    ).toThrow(/Unpaid/);
  });
  it("requires a reason", () => {
    expect(() =>
      assertCanCompleteFulfillment({
        paymentStatus: "PAID",
        targetStatus: "COMPLETED",
        role: "ORDER_MANAGER",
        reason: "  ",
      }),
    ).toThrow(/reason/);
  });
  it("allows super admin with a reason", () => {
    expect(() =>
      assertCanCompleteFulfillment({
        paymentStatus: "PENDING",
        targetStatus: "COMPLETED",
        role: "SUPER_ADMIN",
        reason: "exception documented",
      }),
    ).not.toThrow();
  });
});

describe("pricing", () => {
  it("never overwrites a manual price lock", () => {
    const locked = resolveStorefrontPrice({
      costFils: 10000,
      markupBps: 2200,
      currentPriceFils: 11111,
      manualPriceOverride: true,
    });
    expect(locked).toBe(11111);
    expect(sellingPriceFromCost(10000, 2200)).toBe(12200);
  });
  it("warns below minimum margin", () => {
    expect(belowMinimumMargin(10000, 9500, 800)).toBe(true);
    expect(belowMinimumMargin(10000, 7000, 800)).toBe(false);
  });
});

describe("published-product filtering", () => {
  it("hides drafts and unpublished variants", () => {
    expect(isStorefrontVisible({ status: "DRAFT" })).toBe(false);
    expect(isStorefrontVisible({ status: "ARCHIVED" }, { published: true })).toBe(false);
    expect(isStorefrontVisible({ status: "PUBLISHED" }, { published: false })).toBe(false);
    expect(isStorefrontVisible({ status: "PUBLISHED" }, { published: true })).toBe(true);
  });
});

describe("Arabic content fallback", () => {
  it("falls back to English then first row", () => {
    const rows = [
      { locale: "en", value: "PlayStation" },
      { locale: "ar", value: "بلايستيشن" },
    ];
    expect(pickLocalized(rows, "ar")?.value).toBe("بلايستيشن");
    expect(pickLocalized([{ locale: "en", value: "Steam" }], "ar")?.value).toBe("Steam");
  });
});

describe("audit redaction", () => {
  it("strips secrets and PIN-like fields", () => {
    const sanitized = sanitizeAudit({ password: "secret", pin: "1234", action: "login" }) as Record<string, string>;
    expect(sanitized.password).toBe("[redacted]");
    expect(sanitized.pin).toBe("[redacted]");
    expect(sanitized.action).toBe("login");
  });
});

describe("HTML sanitization", () => {
  it("strips scripts before storage/render", () => {
    expect(sanitizeRichText('<p>ok</p><script>alert(1)</script>')).toBe("<p>ok</p>");
  });
});
