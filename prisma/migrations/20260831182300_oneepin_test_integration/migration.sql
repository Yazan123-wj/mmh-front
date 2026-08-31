-- AlterTable
ALTER TABLE "DigitalCode" ADD COLUMN     "fingerprint" TEXT,
ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SupplierApiLog" ADD COLUMN     "correlationId" TEXT,
ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "relatedOrderId" TEXT,
ADD COLUMN     "resultCode" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SupplierBalanceSnapshot" ADD COLUMN     "durationMs" INTEGER,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "ok" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SupplierCategoryMapping" ADD COLUMN     "categoryType" TEXT,
ADD COLUMN     "descriptionHtml" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "usageHtml" TEXT;

-- AlterTable
ALTER TABLE "SupplierConnection" ADD COLUMN     "lastBalanceAt" TIMESTAMP(3),
ADD COLUMN     "lastCallbackAt" TIMESTAMP(3),
ADD COLUMN     "lastCatalogSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastFailedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SupplierOrder" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "correlationId" TEXT,
ADD COLUMN     "isTest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "orderStatusCode" INTEGER,
ADD COLUMN     "orderStatusMessage" TEXT,
ADD COLUMN     "resultCode" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supplierRef" TEXT,
ADD COLUMN     "unknownReason" TEXT;

UPDATE "SupplierOrder" SET "supplierRef" = 'MIG-' || id WHERE "supplierRef" IS NULL;

ALTER TABLE "SupplierOrder" ALTER COLUMN "supplierRef" SET NOT NULL;

-- AlterTable
ALTER TABLE "SupplierProductMapping" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "categoryType" TEXT,
ADD COLUMN     "externalCategoryId" TEXT,
ADD COLUMN     "ignored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "previousSupplierCostAmount" DECIMAL(14,4),
ADD COLUMN     "supplierPriceAmount" DECIMAL(14,4),
ADD COLUMN     "supplierPriceCurrency" TEXT,
ADD COLUMN     "variantId" TEXT;

-- AlterTable
ALTER TABLE "SupplierWebhookEvent" ADD COLUMN     "conflict" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "payloadHash" TEXT,
ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT false;

UPDATE "SupplierWebhookEvent"
SET
  "dedupeKey" = COALESCE("dedupeKey", id),
  "orderNumber" = COALESCE("orderNumber", 'unknown'),
  "payloadHash" = COALESCE("payloadHash", id)
WHERE "dedupeKey" IS NULL OR "orderNumber" IS NULL OR "payloadHash" IS NULL;

ALTER TABLE "SupplierWebhookEvent" ALTER COLUMN "dedupeKey" SET NOT NULL;
ALTER TABLE "SupplierWebhookEvent" ALTER COLUMN "orderNumber" SET NOT NULL;
ALTER TABLE "SupplierWebhookEvent" ALTER COLUMN "payloadHash" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DigitalCode_fingerprint_key" ON "DigitalCode"("fingerprint");

-- CreateIndex
CREATE INDEX "SupplierApiLog_createdAt_idx" ON "SupplierApiLog"("createdAt");

-- CreateIndex
CREATE INDEX "SupplierApiLog_correlationId_idx" ON "SupplierApiLog"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOrder_supplierRef_key" ON "SupplierOrder"("supplierRef");

-- CreateIndex
CREATE INDEX "SupplierOrder_status_lastCheckedAt_idx" ON "SupplierOrder"("status", "lastCheckedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierWebhookEvent_dedupeKey_key" ON "SupplierWebhookEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "SupplierWebhookEvent_orderNumber_idx" ON "SupplierWebhookEvent"("orderNumber");

-- AddForeignKey
ALTER TABLE "SupplierProductMapping" ADD CONSTRAINT "SupplierProductMapping_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
