import { prisma } from "@/server/db";
import { sanitizeRichText } from "@/server/html";
import { resolveStorefrontPrice, belowMinimumMargin } from "@/server/pricing/calculate";
import type { OneEpinClient } from "@/server/suppliers/1epin/client";
import { getOneEpinSupplier, writeSupplierLog } from "@/server/suppliers/1epin/store";
import { Prisma } from "@prisma/client";

export interface SyncSummary {
  runId: string;
  categories: number;
  products: number;
  newUnmapped: number;
  missing: number;
  costChanges: number;
  errors: number;
}

export async function synchronizeCatalog(client: OneEpinClient, kind: "categories" | "products" | "full" = "full"): Promise<SyncSummary> {
  const supplier = await getOneEpinSupplier();
  const run = await prisma.supplierSyncRun.create({
    data: { supplierId: supplier.id, kind, status: "processing", message: "1Epin test sync" },
  });
  let categories = 0;
  let products = 0;
  let newUnmapped = 0;
  let missing = 0;
  let costChanges = 0;
  let errors = 0;
  try {
    if (kind === "categories" || kind === "full") {
      const info = await client.categoryInfo();
      categories = info.length;
      for (const category of info) {
        let description: string | undefined;
        let usage: string | undefined;
        let image = category.imageUrl;
        try {
          const detail = await client.categoryDetail(category.categoryId);
          description = detail.descriptionHtml ? sanitizeRichText(detail.descriptionHtml) : undefined;
          usage = detail.usageHtml ? sanitizeRichText(detail.usageHtml) : undefined;
          image = detail.imageUrl ?? image;
        } catch {
          errors += 1;
        }
        await prisma.supplierCategoryMapping.upsert({
          where: {
            supplierId_externalCategoryId: { supplierId: supplier.id, externalCategoryId: category.categoryId },
          },
          update: {
            name: category.categoryName,
            categoryType: category.categoryType,
            imageUrl: image,
            descriptionHtml: description,
            usageHtml: usage,
            lastSyncedAt: new Date(),
          },
          create: {
            supplierId: supplier.id,
            externalCategoryId: category.categoryId,
            name: category.categoryName,
            categoryType: category.categoryType,
            imageUrl: image,
            descriptionHtml: description,
            usageHtml: usage,
            lastSyncedAt: new Date(),
          },
        });
        await prisma.supplierSyncItem.create({
          data: { runId: run.id, externalId: category.categoryId, status: "ok", message: category.categoryName },
        });
      }
    }
    if (kind === "products" || kind === "full") {
      const rows = await client.allProducts();
      products = rows.length;
      const seen = new Set<string>();
      const markup = await prisma.pricingRule.findFirst({ where: { type: "PERCENT_MARKUP", enabled: true } });
      const minMargin = await prisma.pricingRule.findFirst({ where: { type: "MINIMUM_MARGIN", enabled: true } });
      for (const product of rows) {
        seen.add(product.productId);
        const existing = await prisma.supplierProductMapping.findUnique({
          where: { supplierId_externalProductId: { supplierId: supplier.id, externalProductId: product.productId } },
          include: { variant: true },
        });
        const previous = existing?.supplierPriceAmount;
        const changed = previous != null && previous.toString() !== product.price;
        if (changed) costChanges += 1;
        if (!existing) newUnmapped += 1;
        await prisma.supplierProductMapping.upsert({
          where: { supplierId_externalProductId: { supplierId: supplier.id, externalProductId: product.productId } },
          update: {
            name: product.productName,
            externalCategoryId: product.categoryId,
            categoryType: product.categoryType,
            previousSupplierCostAmount: changed ? previous : existing?.previousSupplierCostAmount,
            supplierPriceAmount: new Prisma.Decimal(product.price),
            available: true,
            needsReview: existing?.mapped ? existing.needsReview : true,
            lastSyncedAt: new Date(),
          },
          create: {
            supplierId: supplier.id,
            externalProductId: product.productId,
            externalCategoryId: product.categoryId,
            name: product.productName,
            categoryType: product.categoryType,
            supplierPriceAmount: new Prisma.Decimal(product.price),
            mapped: false,
            needsReview: true,
            available: true,
            lastSyncedAt: new Date(),
          },
        });
        if (existing?.variant && changed && !existing.variant.manualPriceOverride && existing.variant.automaticPricing) {
          const costFils = existing.variant.costFils;
          const suggested = resolveStorefrontPrice({
            costFils,
            markupBps: markup?.percentBps ?? 2200,
            currentPriceFils: existing.variant.priceFils,
            manualPriceOverride: false,
          });
          if (!belowMinimumMargin(suggested, costFils, minMargin?.minMarginBps ?? 800)) {
            await prisma.productVariant.update({
              where: { id: existing.variant.id },
              data: { priceFils: suggested },
            });
          }
        }
        await prisma.supplierSyncItem.create({
          data: { runId: run.id, externalId: product.productId, status: changed ? "cost-change" : "ok", message: product.productName },
        });
      }
      const mapped = await prisma.supplierProductMapping.findMany({ where: { supplierId: supplier.id } });
      for (const row of mapped) {
        if (!seen.has(row.externalProductId)) {
          missing += 1;
          await prisma.supplierProductMapping.update({
            where: { id: row.id },
            data: { available: false, needsReview: true },
          });
          await prisma.supplierSyncItem.create({
            data: { runId: run.id, externalId: row.externalProductId, status: "missing", message: "Supplier product missing" },
          });
        }
      }
    }
    await prisma.supplierSyncRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        finishedAt: new Date(),
        message: `categories=${categories} products=${products} new=${newUnmapped} missing=${missing}`,
      },
    });
    await prisma.supplierConnection.updateMany({
      where: { supplierId: supplier.id },
      data: { lastCatalogSyncAt: new Date(), lastSuccessAt: new Date(), lastError: null },
    });
    await writeSupplierLog({
      supplierId: supplier.id,
      action: `sync.${kind}`,
      ok: true,
      message: "Catalog synchronized (test)",
    });
    return { runId: run.id, categories, products, newUnmapped, missing, costChanges, errors };
  } catch (error) {
    await prisma.supplierSyncRun.update({
      where: { id: run.id },
      data: { status: "failed", finishedAt: new Date(), message: error instanceof Error ? error.message : "sync failed" },
    });
    throw error;
  }
}

export async function retryFailedSyncItem(client: OneEpinClient, externalProductId: string) {
  const products = await client.allProducts();
  const found = products.find((item) => item.productId === externalProductId);
  if (!found) throw new Error("Supplier product is still missing.");
  await synchronizeCatalog(client, "products");
  return found;
}
