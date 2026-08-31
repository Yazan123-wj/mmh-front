import { createHash } from "crypto";
import { nanoid } from "nanoid";
import { prisma } from "@/server/db";
import { encryptSecret, maskSecret } from "@/server/crypto/codes";
import { resolveStorefrontPrice, sellingPriceFromCost, belowMinimumMargin } from "@/server/pricing/calculate";
import { callbackConfigured, credentialsConfigured } from "@/server/suppliers/1epin/config";

export function newSupplierRef(isTest: boolean) {
  const prefix = isTest ? "TEP" : "EPN";
  return `${prefix}-${nanoid(12).toUpperCase()}`;
}

export function pinFingerprint(pin: string) {
  return createHash("sha256").update(pin).digest("hex");
}

export async function getOneEpinSupplier() {
  const supplier = await prisma.supplier.upsert({
    where: { slug: "1epin" },
    update: {},
    create: { slug: "1epin", name: "1Epin", environment: "TEST", enabled: true },
  });
  const connection = await prisma.supplierConnection.findFirst({ where: { supplierId: supplier.id } });
  if (!connection) {
    await prisma.supplierConnection.create({
      data: {
        supplierId: supplier.id,
        environment: "TEST",
        enabled: true,
        credentialConfigured: credentialsConfigured(),
        callbackConfigured: callbackConfigured(),
      },
    });
  }
  return supplier;
}

export async function writeSupplierLog(input: {
  supplierId: string;
  action: string;
  ok: boolean;
  statusCode?: number;
  resultCode?: string;
  message: string;
  correlationId?: string;
  durationMs?: number;
  retryCount?: number;
  relatedOrderId?: string;
}) {
  await prisma.supplierApiLog.create({
    data: {
      supplierId: input.supplierId,
      action: input.action,
      ok: input.ok,
      statusCode: input.statusCode,
      resultCode: input.resultCode,
      message: input.message.slice(0, 500),
      correlationId: input.correlationId,
      durationMs: input.durationMs,
      retryCount: input.retryCount ?? 0,
      relatedOrderId: input.relatedOrderId,
    },
  });
}

export async function storeEncryptedPins(input: {
  orderItemId: string;
  pins: string[];
  isTest: boolean;
}) {
  const stored = [];
  for (const pin of input.pins) {
    const fingerprint = pinFingerprint(pin);
    const existing = await prisma.digitalCode.findUnique({ where: { fingerprint } });
    if (existing) {
      stored.push(existing);
      continue;
    }
    const enc = encryptSecret(pin);
    const row = await prisma.digitalCode.create({
      data: {
        orderItemId: input.orderItemId,
        ...enc,
        masked: maskSecret(pin),
        fingerprint,
        isTest: input.isTest,
      },
    });
    stored.push(row);
  }
  return stored;
}

export function suggestedPricePreview(input: {
  supplierPrice: string;
  currentPriceFils: number;
  costFils: number;
  markupBps: number;
  minMarginBps: number;
  manualPriceOverride: boolean;
  convertedCostFils: number | null;
}) {
  const suggestedFils =
    input.convertedCostFils != null ? sellingPriceFromCost(input.convertedCostFils, input.markupBps) : null;
  const stored = resolveStorefrontPrice({
    costFils: input.convertedCostFils ?? input.costFils,
    markupBps: input.markupBps,
    currentPriceFils: input.currentPriceFils,
    manualPriceOverride: input.manualPriceOverride,
  });
  const cost = input.convertedCostFils ?? input.costFils;
  return {
    supplierPrice: input.supplierPrice,
    suggestedFils,
    currentFils: stored,
    lowMargin: belowMinimumMargin(stored, cost, input.minMarginBps),
    locked: input.manualPriceOverride,
  };
}
