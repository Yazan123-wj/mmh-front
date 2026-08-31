import { prisma } from "@/server/db";
import type { OneEpinClient } from "@/server/suppliers/1epin/client";
import { mapOrderStatusCode } from "@/server/suppliers/1epin/types";
import { storeEncryptedPins, writeSupplierLog } from "@/server/suppliers/1epin/store";
import { OneEpinApiError } from "@/server/suppliers/1epin/errors";
import { writeAudit } from "@/server/audit";

const STALE_MS = 2 * 60 * 1000;

export async function reconcileSupplierRef(client: OneEpinClient, supplierRef: string) {
  const row = await prisma.supplierOrder.findUnique({
    where: { supplierRef },
    include: { order: { include: { items: true } } },
  });
  if (!row) throw new Error("Supplier order not found.");
  const claimed = await prisma.supplierOrder.updateMany({
    where: {
      id: row.id,
      OR: [{ claimedAt: null }, { claimedAt: { lt: new Date(Date.now() - 30_000) } }],
    },
    data: { claimedAt: new Date(), lastCheckedAt: new Date() },
  });
  if (claimed.count === 0) return { skipped: true as const, reason: "claimed" };
  try {
    const result = await client.checkOrder(supplierRef);
    const status = mapOrderStatusCode(result.orderStatusCode);
    await prisma.supplierOrder.update({
      where: { id: row.id },
      data: {
        status,
        resultCode: result.resultCode,
        orderStatusCode: result.orderStatusCode,
        orderStatusMessage: result.orderStatusMessage,
        message: result.orderStatusMessage || result.resultMessage,
        retryCount: { increment: 1 },
        unknownReason: status === "UNKNOWN" ? result.orderStatusMessage : null,
        claimedAt: null,
      },
    });
    await prisma.order.update({
      where: { id: row.orderId },
      data: { supplierStatus: status },
    });
    if (status === "COMPLETED") {
      if (!row.isTest && row.order.paymentStatus !== "PAID") {
        await prisma.order.update({
          where: { id: row.orderId },
          data: { fulfillmentStatus: "MANUAL_REVIEW" },
        });
        await writeAudit({
          action: "supplier.unpaid_complete_blocked",
          entityType: "SupplierOrder",
          entityId: row.id,
          after: { reason: "Supplier completed but customer payment is not PAID" },
        });
      } else {
        const item = row.order.items[0];
        if (item && result.pinCodes.length > 0) {
          await storeEncryptedPins({ orderItemId: item.id, pins: result.pinCodes, isTest: row.isTest });
        }
        await prisma.order.update({
          where: { id: row.orderId },
          data: {
            fulfillmentStatus: "COMPLETED",
            history: {
              create: {
                field: "fulfillmentStatus",
                fromValue: row.order.fulfillmentStatus,
                toValue: "COMPLETED",
                reason: row.isTest ? "1Epin test checkOrder" : "1Epin checkOrder",
              },
            },
          },
        });
      }
    }
    if (status === "FAILED") {
      await prisma.order.update({
        where: { id: row.orderId },
        data: {
          fulfillmentStatus: "FAILED",
          history: {
            create: {
              field: "fulfillmentStatus",
              fromValue: row.order.fulfillmentStatus,
              toValue: "FAILED",
              reason: result.orderStatusMessage || "supplier failed",
            },
          },
        },
      });
      await prisma.adminNotification.create({
        data: {
          title: "Supplier fulfillment failed",
          body: `${supplierRef} · ${result.orderStatusMessage || "failed"}`,
          href: `/admin/orders/${row.orderId}`,
        },
      });
    }
    await writeSupplierLog({
      supplierId: row.supplierId,
      action: "checkOrder",
      ok: result.resultCode === "00",
      resultCode: result.resultCode,
      message: result.orderStatusMessage || result.resultMessage,
      correlationId: result.meta.correlationId,
      durationMs: result.meta.durationMs,
      relatedOrderId: row.orderId,
    });
    return { skipped: false as const, status, resultCode: result.resultCode };
  } catch (error) {
    await prisma.supplierOrder.update({
      where: { id: row.id },
      data: {
        claimedAt: null,
        status: error instanceof OneEpinApiError && error.resultCode === "08" ? "FAILED" : "UNKNOWN",
        unknownReason: error instanceof Error ? error.message : "checkOrder failed",
      },
    });
    throw error;
  }
}

export async function reconcileStaleSupplierOrders(client: OneEpinClient, limit = 20) {
  const stale = new Date(Date.now() - STALE_MS);
  const rows = await prisma.supplierOrder.findMany({
    where: {
      status: { in: ["PROCESSING", "SUBMITTING", "UNKNOWN"] },
      OR: [{ lastCheckedAt: null }, { lastCheckedAt: { lt: stale } }],
    },
    take: limit,
    orderBy: { updatedAt: "asc" },
  });
  const results = [];
  for (const row of rows) {
    results.push(await reconcileSupplierRef(client, row.supplierRef));
  }
  return { checked: results.length };
}

export async function handleAddOrderOutcome(input: {
  client: OneEpinClient;
  supplierRef: string;
  addError?: unknown;
  timedOut?: boolean;
}) {
  if (input.timedOut) {
    await prisma.supplierOrder.update({
      where: { supplierRef: input.supplierRef },
      data: { status: "UNKNOWN", unknownReason: "addOrder timeout — reconciling" },
    });
    return reconcileSupplierRef(input.client, input.supplierRef);
  }
  if (input.addError instanceof OneEpinApiError && input.addError.resultCode === "07") {
    return reconcileSupplierRef(input.client, input.supplierRef);
  }
  if (input.addError instanceof OneEpinApiError && input.addError.resultCode === "08") {
    return { skipped: false as const, status: "FAILED" as const, resultCode: "08" };
  }
  throw input.addError;
}
