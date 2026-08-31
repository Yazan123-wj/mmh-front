"use server";

import { forbidden } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { writeAudit } from "@/server/audit";
import { prisma } from "@/server/db";
import { OneEpinClient } from "@/server/suppliers/1epin/client";
import { resolveOneEpinConfig, publicIntegrationStatus, credentialsConfigured } from "@/server/suppliers/1epin/config";
import { getOneEpinSupplier, writeSupplierLog } from "@/server/suppliers/1epin/store";
import { synchronizeCatalog, retryFailedSyncItem } from "@/server/suppliers/1epin/sync";
import { submitTestOrder } from "@/server/suppliers/1epin/test-orders";
import { reconcileStaleSupplierOrders, reconcileSupplierRef } from "@/server/suppliers/1epin/reconciliation";
import { MockSupplierProvider } from "@/server/suppliers/provider";
import { suggestedPricePreview } from "@/server/suppliers/1epin/store";
import { filsToJod } from "@/server/money";

function revalidateIntegration() {
  revalidatePath("/admin/integrations/1epin");
  revalidatePath("/admin/integrations/1epin/logs");
  revalidatePath("/admin/integrations/1epin/test");
}

async function clientOrThrow() {
  const config = resolveOneEpinConfig();
  const supplier = await getOneEpinSupplier();
  return new OneEpinClient(config, {
    onLog: (event) =>
      writeSupplierLog({
        supplierId: supplier.id,
        action: event.action,
        ok: event.ok,
        statusCode: event.statusCode,
        resultCode: event.resultCode,
        message: event.message,
        correlationId: event.correlationId,
        durationMs: event.durationMs,
        retryCount: event.retryCount,
      }),
  });
}

export async function integrationStatusAction() {
  await requireAdmin(PERMISSIONS.catalogRead);
  return publicIntegrationStatus();
}

export async function testOneEpinConnection() {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  if (!credentialsConfigured()) {
    const mock = new MockSupplierProvider();
    const result = await mock.checkConnection();
    await writeAudit({ actorId: user.id, action: "oneepin.ping_mock", entityType: "Supplier", entityId: "1epin", after: { mode: "mock" } });
    revalidateIntegration();
    return { ...result, source: "mock" as const };
  }
  const client = await clientOrThrow();
  try {
    const balance = await client.checkBalance();
    const supplier = await getOneEpinSupplier();
    await prisma.supplierConnection.updateMany({
      where: { supplierId: supplier.id },
      data: {
        lastSuccessAt: new Date(),
        lastError: null,
        credentialConfigured: true,
        environment: "TEST",
      },
    });
    await writeAudit({ actorId: user.id, action: "oneepin.ping", entityType: "Supplier", entityId: supplier.id, after: { ok: true, mode: "test" } });
    revalidateIntegration();
    return { ok: true, mode: "test" as const, message: balance.resultMessage, source: "test" as const };
  } catch (error) {
    const supplier = await getOneEpinSupplier();
    await prisma.supplierConnection.updateMany({
      where: { supplierId: supplier.id },
      data: {
        lastFailedAt: new Date(),
        lastError: error instanceof Error ? error.message.slice(0, 240) : "1Epin ping failed",
      },
    });
    throw error;
  }
}

export async function checkOneEpinBalance() {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  if (!credentialsConfigured()) {
    const mock = new MockSupplierProvider();
    const result = await mock.getBalance();
    revalidateIntegration();
    return result;
  }
  const client = await clientOrThrow();
  const result = await client.checkBalance();
  const supplier = await getOneEpinSupplier();
  await prisma.supplierBalanceSnapshot.create({
    data: {
      supplierId: supplier.id,
      amount: result.balance,
      currency: result.currency,
      ok: result.resultCode === "00",
      durationMs: result.meta.durationMs,
      message: result.resultMessage,
    },
  });
  await prisma.supplierConnection.updateMany({
    where: { supplierId: supplier.id },
    data: { lastBalanceAt: new Date(), lastSuccessAt: new Date() },
  });
  await writeAudit({ actorId: user.id, action: "oneepin.balance", entityType: "Supplier", entityId: supplier.id, after: { currency: result.currency } });
  revalidateIntegration();
  return { amount: result.balance, currency: result.currency, asOf: new Date().toISOString() };
}

export async function syncOneEpin(kind: "categories" | "products" | "full") {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  if (!credentialsConfigured()) {
    const { mockSupplierSync } = await import("@/server/actions/admin");
    return mockSupplierSync();
  }
  const client = await clientOrThrow();
  const summary = await synchronizeCatalog(client, kind);
  await writeAudit({ actorId: user.id, action: `oneepin.sync.${kind}`, entityType: "SupplierSyncRun", entityId: summary.runId, after: summary });
  revalidateIntegration();
  return summary;
}

export async function retryOneEpinSyncItem(externalProductId: string) {
  await requireAdmin(PERMISSIONS.integrationWrite);
  const client = await clientOrThrow();
  await retryFailedSyncItem(client, externalProductId);
  revalidateIntegration();
}

export async function mapOneEpinProduct(formData: FormData) {
  await requireAdmin(PERMISSIONS.catalogWrite);
  const mappingId = String(formData.get("mappingId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error("Variant not found");
  await prisma.supplierProductMapping.update({
    where: { id: mappingId },
    data: { variantId, productId: variant.productId, mapped: true, ignored: false, needsReview: false },
  });
  revalidateIntegration();
}

export async function ignoreOneEpinProduct(mappingId: string) {
  await requireAdmin(PERMISSIONS.catalogWrite);
  await prisma.supplierProductMapping.update({ where: { id: mappingId }, data: { ignored: true, mapped: false, needsReview: false } });
  revalidateIntegration();
}

export async function unmapOneEpinProduct(mappingId: string) {
  await requireAdmin(PERMISSIONS.catalogWrite);
  await prisma.supplierProductMapping.update({
    where: { id: mappingId },
    data: { mapped: false, variantId: null, productId: null, needsReview: true },
  });
  revalidateIntegration();
}

export async function createDraftFromSupplier(mappingId: string) {
  const user = await requireAdmin(PERMISSIONS.catalogWrite);
  const mapping = await prisma.supplierProductMapping.findUnique({ where: { id: mappingId } });
  if (!mapping) throw new Error("Mapping not found");
  const category = await prisma.category.findFirst();
  const platform = await prisma.platform.findFirst();
  if (!category || !platform) throw new Error("Catalog foundations missing");
  const slug = `1epin-${mapping.externalProductId}`.toLowerCase();
  const product = await prisma.product.create({
    data: {
      id: slug,
      slug,
      kind: mapping.categoryType === "top-up" ? "DIRECT_TOPUP" : "DIGITAL_CODE",
      fulfillmentType: mapping.categoryType === "top-up" ? "DIRECT_TOPUP" : "CODE",
      source: "SUPPLIER",
      categoryId: category.id,
      platformId: platform.id,
      brand: "1Epin",
      artworkKey: "digital",
      status: "DRAFT",
      translations: {
        create: [
          { locale: "en", name: mapping.name ?? slug, shortDescription: "", description: "", instructions: "", howToUse: [], regionRestrictions: "", refundPolicy: "" },
          { locale: "ar", name: mapping.name ?? slug, shortDescription: "", description: "", instructions: "", howToUse: [], regionRestrictions: "", refundPolicy: "" },
        ],
      },
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: `1EPIN-${mapping.externalProductId}`,
      denomination: 0,
      packageValue: mapping.name ?? slug,
      packageCurrency: mapping.supplierPriceCurrency ?? "USD",
      priceFils: 0,
      costFils: 0,
      supplierProductId: mapping.externalProductId,
      published: false,
      translations: {
        create: [
          { locale: "en", name: mapping.name ?? slug },
          { locale: "ar", name: mapping.name ?? slug },
        ],
      },
    },
  });
  await prisma.supplierProductMapping.update({
    where: { id: mappingId },
    data: { productId: product.id, variantId: variant.id, mapped: true, needsReview: true },
  });
  await writeAudit({ actorId: user.id, action: "oneepin.draft_product", entityType: "Product", entityId: product.id, after: { status: "DRAFT", externalProductId: mapping.externalProductId } });
  revalidatePath("/admin/catalog");
  revalidateIntegration();
}

export async function previewOneEpinPrice(mappingId: string) {
  await requireAdmin(PERMISSIONS.catalogRead);
  const mapping = await prisma.supplierProductMapping.findUnique({
    where: { id: mappingId },
    include: { variant: true },
  });
  if (!mapping?.variant) return null;
  const markup = await prisma.pricingRule.findFirst({ where: { type: "PERCENT_MARKUP", enabled: true } });
  const minMargin = await prisma.pricingRule.findFirst({ where: { type: "MINIMUM_MARGIN", enabled: true } });
  const preview = suggestedPricePreview({
    supplierPrice: mapping.supplierPriceAmount?.toString() ?? "0",
    currentPriceFils: mapping.variant.priceFils,
    costFils: mapping.variant.costFils,
    markupBps: markup?.percentBps ?? 2200,
    minMarginBps: minMargin?.minMarginBps ?? 800,
    manualPriceOverride: mapping.variant.manualPriceOverride,
    convertedCostFils: mapping.variant.costFils,
  });
  return {
    ...preview,
    currentJod: filsToJod(preview.currentFils),
    suggestedJod: preview.suggestedFils != null ? filsToJod(preview.suggestedFils) : null,
    previousCost: mapping.previousSupplierCostAmount?.toString() ?? null,
  };
}

export async function submitOneEpinTestOrder(formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  if (user.role !== "SUPER_ADMIN") forbidden();
  const client = await clientOrThrow();
  const result = await submitTestOrder({
    client,
    actorId: user.id,
    externalProductId: String(formData.get("productId") ?? ""),
    quantity: Number(formData.get("quantity") ?? 1),
    userField: String(formData.get("userField") ?? "") || undefined,
    barem: String(formData.get("barem") ?? "") || undefined,
  });
  revalidateIntegration();
  revalidatePath("/admin/orders");
  return result;
}

export async function checkOneEpinTestOrder(supplierRef: string) {
  const user = await requireAdmin(PERMISSIONS.orderWrite);
  const client = await clientOrThrow();
  const result = await reconcileSupplierRef(client, supplierRef);
  await writeAudit({ actorId: user.id, action: "oneepin.reconcile", entityType: "SupplierOrder", entityId: supplierRef, after: result });
  revalidateIntegration();
  return result;
}

export async function reconcileProcessingOneEpinOrders() {
  await requireAdmin(PERMISSIONS.orderWrite);
  const client = await clientOrThrow();
  const result = await reconcileStaleSupplierOrders(client);
  revalidateIntegration();
  return result;
}
