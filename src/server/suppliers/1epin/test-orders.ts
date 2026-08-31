import { prisma } from "@/server/db";
import { nanoid } from "nanoid";
import type { OneEpinClient } from "@/server/suppliers/1epin/client";
import { OneEpinApiError } from "@/server/suppliers/1epin/errors";
import { getOneEpinSupplier, newSupplierRef, writeSupplierLog } from "@/server/suppliers/1epin/store";
import { handleAddOrderOutcome, reconcileSupplierRef } from "@/server/suppliers/1epin/reconciliation";
import { writeAudit } from "@/server/audit";

export async function submitTestOrder(input: {
  client: OneEpinClient;
  actorId: string;
  externalProductId: string;
  quantity: number;
  userField?: string;
  barem?: string;
}) {
  const supplier = await getOneEpinSupplier();
  const mapping = await prisma.supplierProductMapping.findFirst({
    where: { supplierId: supplier.id, externalProductId: input.externalProductId },
  });
  const supplierRef = newSupplierRef(true);
  const order = await prisma.order.create({
    data: {
      number: `TEST-${nanoid(8).toUpperCase()}`,
      email: "oneepin-test@internal.local",
      fullName: "1Epin test console",
      phone: "+962000000000",
      isTest: true,
      subtotalFils: 0,
      totalFils: 0,
      paymentStatus: "PENDING",
      fulfillmentStatus: "QUEUED",
      supplierStatus: "SUBMITTING",
      idempotencyKey: `test-${supplierRef}`,
      notes: "1Epin test-endpoint order. Not a customer order.",
      items: {
        create: {
          productId: mapping?.productId ?? "test-unmapped",
          variantId: mapping?.variantId ?? (await ensureTestVariant()),
          name: mapping?.name ?? input.externalProductId,
          nameAr: mapping?.name ?? input.externalProductId,
          quantity: input.quantity,
          unitPriceFils: 0,
          lineTotalFils: 0,
        },
      },
    },
    include: { items: true },
  });
  await prisma.supplierOrder.create({
    data: {
      orderId: order.id,
      supplierId: supplier.id,
      supplierRef,
      isTest: true,
      status: "SUBMITTING",
    },
  });
  try {
    const result = await input.client.addOrder({
      productId: input.externalProductId,
      orderNumber: supplierRef,
      quantity: mapping?.categoryType === "epin" || !input.userField ? input.quantity : undefined,
      user: input.userField,
      barem: input.barem,
    });
    await prisma.supplierOrder.update({
      where: { supplierRef },
      data: { status: "PROCESSING", resultCode: result.resultCode, message: result.resultMessage, correlationId: result.meta.correlationId },
    });
    await prisma.order.update({ where: { id: order.id }, data: { supplierStatus: "PROCESSING" } });
    await writeSupplierLog({
      supplierId: supplier.id,
      action: "addOrder",
      ok: true,
      resultCode: result.resultCode,
      message: result.resultMessage,
      correlationId: result.meta.correlationId,
      durationMs: result.meta.durationMs,
      relatedOrderId: order.id,
    });
    await writeAudit({
      actorId: input.actorId,
      action: "oneepin.test_order",
      entityType: "SupplierOrder",
      entityId: supplierRef,
      after: { product: input.externalProductId, isTest: true },
    });
    const checked = await reconcileSupplierRef(input.client, supplierRef);
    return { orderId: order.id, orderNumber: order.number, supplierRef, checked };
  } catch (error) {
    const timedOut = error instanceof OneEpinApiError && error.code === "TIMEOUT";
    await handleAddOrderOutcome({ client: input.client, supplierRef, addError: error, timedOut });
    await writeAudit({
      actorId: input.actorId,
      action: "oneepin.test_order_uncertain",
      entityType: "SupplierOrder",
      entityId: supplierRef,
      after: { resultCode: error instanceof OneEpinApiError ? error.resultCode : "UNKNOWN", isTest: true },
    });
    return { orderId: order.id, orderNumber: order.number, supplierRef, checked: { status: "UNKNOWN" } };
  }
}

async function ensureTestVariant() {
  const existing = await prisma.productVariant.findFirst({ where: { sku: "TEP-INTERNAL" } });
  if (existing) return existing.id;
  const product = await prisma.product.findFirst();
  if (!product) throw new Error("Catalog is empty.");
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: "TEP-INTERNAL",
      denomination: 0,
      packageValue: "1Epin test",
      packageCurrency: "USD",
      priceFils: 0,
      costFils: 0,
      published: false,
      translations: { create: [{ locale: "en", name: "1Epin test" }, { locale: "ar", name: "اختبار 1Epin" }] },
    },
  });
  return variant.id;
}

export async function assertNotCustomerFulfillment(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (!order.isTest && order.paymentStatus !== "PAID") {
    throw new Error("Unpaid customer orders cannot be sent to 1Epin.");
  }
  if (!order.isTest) {
    throw new Error("Automatic supplier fulfillment is disabled until payment integration is complete.");
  }
}
