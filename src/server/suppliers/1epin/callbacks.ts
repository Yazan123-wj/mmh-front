import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { callbackSchema } from "@/server/suppliers/1epin/schemas";
import { redactDeep } from "@/server/suppliers/1epin/redaction";
import { callbackConfigured } from "@/server/suppliers/1epin/config";
import { getOneEpinSupplier } from "@/server/suppliers/1epin/store";
import { reconcileSupplierRef } from "@/server/suppliers/1epin/reconciliation";
import type { OneEpinClient } from "@/server/suppliers/1epin/client";

export const CALLBACK_OK = "OK";

export function tokensMatch(provided: string, expected: string) {
  if (!expected || expected.length < 16 || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function acceptCallback(input: {
  token: string;
  expectedToken: string;
  body: unknown;
  client?: OneEpinClient | null;
  ip?: string | null;
  contentLength?: number;
}) {
  if (!callbackConfigured({ ONEEPIN_CALLBACK_TOKEN: input.expectedToken })) {
    return { status: 404 as const, body: "Not found" };
  }
  if (!tokensMatch(input.token, input.expectedToken)) {
    return { status: 404 as const, body: "Not found" };
  }
  if (input.contentLength && input.contentLength > 64 * 1024) {
    return { status: 413 as const, body: "Payload too large" };
  }
  if (input.ip && !rateLimit(`oneepin-callback:${input.ip}`, 30, 60_000)) {
    return { status: 429 as const, body: "Too many requests" };
  }
  const parsed = callbackSchema.safeParse(input.body);
  if (!parsed.success) {
    return { status: 400 as const, body: "Invalid payload" };
  }
  const supplier = await getOneEpinSupplier();
  const payloadHash = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
  const dedupeKey = `${parsed.data.OrderNumber}:${payloadHash}`;
  const existing = await prisma.supplierWebhookEvent.findUnique({ where: { dedupeKey } });
  if (existing) {
    return { status: 200 as const, body: CALLBACK_OK, duplicate: true };
  }
  const order = await prisma.supplierOrder.findUnique({ where: { supplierRef: parsed.data.OrderNumber } });
  if (!order) {
    return { status: 404 as const, body: "Not found" };
  }
  const prior = await prisma.supplierWebhookEvent.findFirst({
    where: { orderNumber: parsed.data.OrderNumber, payloadHash: { not: payloadHash } },
  });
  await prisma.supplierWebhookEvent.create({
    data: {
      supplierId: supplier.id,
      orderNumber: parsed.data.OrderNumber,
      dedupeKey,
      payloadHash,
      payloadRedacted: redactDeep({ ...parsed.data, PinCodes: "[redacted]" }) as object,
      processed: false,
      conflict: Boolean(prior),
    },
  });
  await prisma.supplierConnection.updateMany({
    where: { supplierId: supplier.id },
    data: { lastCallbackAt: new Date() },
  });
  if (!prior && input.client) {
    await reconcileSupplierRef(input.client, parsed.data.OrderNumber);
    await prisma.supplierWebhookEvent.update({ where: { dedupeKey }, data: { processed: true } });
  }
  return { status: 200 as const, body: CALLBACK_OK, duplicate: false, conflict: Boolean(prior) };
}
