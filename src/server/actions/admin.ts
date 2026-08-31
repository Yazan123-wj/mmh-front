"use server";

import { auth } from "@/auth";
import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { writeAudit } from "@/server/audit";
import { getSupplierProvider } from "@/server/suppliers/provider";
import { addFils, jodToFils, multiplyFils } from "@/server/money";
import { storage } from "@/server/storage/provider";
import { sanitizeRichText } from "@/server/html";
import { assertCanCompleteFulfillment } from "@/server/orders/fulfillment";
import { decryptSecret } from "@/server/crypto/codes";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { FulfillmentType, ProductKind, PublishStatus, type AdminRole } from "@prisma/client";
import { headers } from "next/headers";
import { hashPassword, validatePasswordStrength } from "@/server/auth/password";
import { rateLimit } from "@/server/rate-limit";
import { redirect } from "next/navigation";

async function requestMeta() {
  const headerList = await headers();
  return {
    ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerList.get("x-real-ip"),
    userAgent: headerList.get("user-agent"),
  };
}

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/search");
}

export async function setProductStatus(productId: string, status: PublishStatus) {
  const user = await requireAdmin(PERMISSIONS.catalogWrite);
  const before = await prisma.product.findUnique({ where: { id: productId } });
  await prisma.product.update({ where: { id: productId }, data: { status } });
  await writeAudit({
    actorId: user.id,
    action: "product.status",
    entityType: "Product",
    entityId: productId,
    before: { status: before?.status },
    after: { status },
    ...(await requestMeta()),
  });
  revalidateStorefront();
  revalidatePath("/admin/catalog");
}

export async function bulkSetProductStatus(ids: string[], status: PublishStatus) {
  await requireAdmin(PERMISSIONS.catalogWrite);
  const limited = ids.slice(0, 100);
  for (const id of limited) await setProductStatus(id, status);
}

export async function mockSupplierSync() {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  const provider = getSupplierProvider();
  const products = await provider.getProducts();
  const supplier = await prisma.supplier.findFirst({ where: { slug: "1epin" } });
  if (!supplier) throw new Error("Supplier missing");
  const run = await prisma.supplierSyncRun.create({
    data: { supplierId: supplier.id, kind: "catalog", status: "completed", message: "Mock Mode", finishedAt: new Date() },
  });
  for (const item of products) {
    await prisma.supplierProductMapping.upsert({
      where: { supplierId_externalProductId: { supplierId: supplier.id, externalProductId: item.externalId } },
      update: {},
      create: { supplierId: supplier.id, externalProductId: item.externalId, mapped: false },
    });
    await prisma.supplierSyncItem.create({
      data: { runId: run.id, externalId: item.externalId, status: "ok", message: "Mock Mode" },
    });
  }
  await prisma.supplierApiLog.create({
    data: { supplierId: supplier.id, action: "getProducts", ok: true, message: "Mock Mode — redacted" },
  });
  await writeAudit({
    actorId: user.id,
    action: "supplier.sync",
    entityType: "Supplier",
    entityId: supplier.id,
    after: { runId: run.id, count: products.length, mode: "mock" },
    ...(await requestMeta()),
  });
  revalidatePath("/admin/integrations/1epin");
  return { ok: true, count: products.length, mode: "mock" as const };
}

export async function mockSupplierPing() {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  const result = await getSupplierProvider().checkConnection();
  const supplier = await prisma.supplier.findFirst({ where: { slug: "1epin" } });
  if (supplier) {
    await prisma.supplierApiLog.create({
      data: { supplierId: supplier.id, action: "checkConnection", ok: result.ok, message: result.message },
    });
    await prisma.supplierConnection.updateMany({
      where: { supplierId: supplier.id },
      data: { lastSuccessAt: result.ok ? new Date() : undefined, lastError: result.ok ? null : result.message },
    });
  }
  await writeAudit({
    actorId: user.id,
    action: "supplier.ping",
    entityType: "Supplier",
    entityId: supplier?.id ?? "1epin",
    after: { mode: result.mode, ok: result.ok },
  });
  revalidatePath("/admin/integrations/1epin");
  return result;
}

export async function mockSupplierBalance() {
  const user = await requireAdmin(PERMISSIONS.integrationWrite);
  const balance = await getSupplierProvider().getBalance();
  const supplier = await prisma.supplier.findFirst({ where: { slug: "1epin" } });
  if (supplier) {
    await prisma.supplierBalanceSnapshot.create({
      data: { supplierId: supplier.id, amount: balance.amount, currency: balance.currency },
    });
  }
  await writeAudit({
    actorId: user.id,
    action: "supplier.balance",
    entityType: "Supplier",
    entityId: supplier?.id ?? "1epin",
    after: { currency: balance.currency, mode: "mock" },
  });
  revalidatePath("/admin/integrations/1epin");
  return balance;
}

const checkoutSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(32),
  notes: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(8).max(200),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().min(1).max(5),
        fields: z.record(z.string().max(200)).optional(),
      }),
    )
    .min(1)
    .max(20),
});

export async function createPendingOrder(input: unknown) {
  const parsed = checkoutSchema.parse(input);
  if (!rateLimit(`checkout:${parsed.email}`, 12, 10 * 60 * 1000)) {
    throw new Error("Too many checkout attempts. Try again later.");
  }
  const session = await auth();
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { idempotencyKey: parsed.idempotencyKey } });
    if (existing) return { orderNumber: existing.number, id: existing.id };
    let subtotal = 0;
    const lines = [];
    for (const item of parsed.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        include: { product: { include: { fields: true } }, translations: true },
      });
      if (!variant || variant.productId !== item.productId) throw new Error("Invalid item");
      if (variant.product.status !== "PUBLISHED" || !variant.published) throw new Error("Unavailable product");
      if (variant.stockStatus !== "IN_STOCK") throw new Error("Out of stock");
      if (item.quantity < variant.minQuantity || item.quantity > variant.maxQuantity) {
        throw new Error("Quantity is outside the allowed range.");
      }
      for (const field of variant.product.fields) {
        if (!field.required) continue;
        const value = item.fields?.[field.key]?.trim() ?? "";
        if (!value) throw new Error("Required player fields are missing.");
        if (field.minLength && value.length < field.minLength) throw new Error("Player field is too short.");
        if (field.maxLength && value.length > field.maxLength) throw new Error("Player field is too long.");
      }
      const lineTotal = multiplyFils(variant.priceFils, item.quantity);
      subtotal = addFils(subtotal, lineTotal);
      lines.push({ variant, item, lineTotal });
    }
    const order = await tx.order.create({
      data: {
        number: `MMH-${nanoid(8).toUpperCase()}`,
        userId: session?.user?.id,
        email: parsed.email,
        fullName: parsed.fullName,
        phone: parsed.phone,
        notes: parsed.notes,
        subtotalFils: subtotal,
        totalFils: subtotal,
        paymentStatus: "PENDING",
        fulfillmentStatus: "NOT_STARTED",
        supplierStatus: "NOT_SUBMITTED",
        idempotencyKey: parsed.idempotencyKey,
        items: {
          create: lines.map(({ variant, item, lineTotal }) => ({
            productId: variant.productId,
            variantId: variant.id,
            name: variant.translations.find((row) => row.locale === "en")?.name ?? variant.packageValue,
            nameAr: variant.translations.find((row) => row.locale === "ar")?.name ?? variant.packageValue,
            quantity: item.quantity,
            unitPriceFils: variant.priceFils,
            lineTotalFils: lineTotal,
            costFils: multiplyFils(variant.costFils, item.quantity),
            customerFields: item.fields
              ? {
                  create: Object.entries(item.fields).map(([key, value]) => ({
                    key,
                    label: key,
                    value,
                    maskedValue: value.length > 4 ? `${value.slice(0, 2)}••••${value.slice(-2)}` : "••••",
                  })),
                }
              : undefined,
          })),
        },
        payments: { create: { amountFils: subtotal, status: "PENDING", provider: "placeholder" } },
        history: { create: { field: "paymentStatus", toValue: "PENDING", reason: "checkout" } },
      },
    });
    return { orderNumber: order.number, id: order.id };
  });
}

export async function changeOrderFulfillment(
  orderId: string,
  status: "COMPLETED" | "FAILED" | "PROCESSING" | "CANCELLED",
  reason: string,
) {
  const user = await requireAdmin(PERMISSIONS.orderWrite);
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  assertCanCompleteFulfillment({
    paymentStatus: order.paymentStatus,
    targetStatus: status,
    role: user.role,
    reason,
  });
  if (status === "COMPLETED" && order.paymentStatus !== "PAID") {
    await requireAdmin(PERMISSIONS.orderFulfillUnpaid);
  }
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: status,
        history: {
          create: {
            field: "fulfillmentStatus",
            fromValue: order.fulfillmentStatus,
            toValue: status,
            reason,
            actorId: user.id,
          },
        },
      },
    });
  });
  await writeAudit({
    actorId: user.id,
    action: "order.fulfillment",
    entityType: "Order",
    entityId: orderId,
    before: { status: order.fulfillmentStatus, paymentStatus: order.paymentStatus },
    after: { status, reason },
    ...(await requestMeta()),
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function saveBannerPublish(id: string, published: boolean) {
  const user = await requireAdmin(PERMISSIONS.contentWrite);
  await prisma.banner.update({ where: { id }, data: { published } });
  await writeAudit({ actorId: user.id, action: "banner.publish", entityType: "Banner", entityId: id, after: { published } });
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

const productFormSchema = z.object({
  id: z.string().min(2).max(80).optional(),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  nameEn: z.string().min(2).max(160),
  nameAr: z.string().min(2).max(160),
  shortEn: z.string().max(400).default(""),
  shortAr: z.string().max(400).default(""),
  descriptionEn: z.string().max(8000).default(""),
  descriptionAr: z.string().max(8000).default(""),
  instructionsEn: z.string().max(4000).default(""),
  instructionsAr: z.string().max(4000).default(""),
  categoryId: z.string(),
  platformId: z.string(),
  kind: z.nativeEnum(ProductKind),
  fulfillmentType: z.nativeEnum(FulfillmentType),
  brand: z.string().min(1).max(80),
  artworkKey: z.string().min(1).max(80),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  refundable: z.boolean().optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  publish: z.boolean().optional(),
});

function formBool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function createProduct(formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.catalogWrite);
  const parsed = productFormSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    shortEn: String(formData.get("shortEn") ?? ""),
    shortAr: String(formData.get("shortAr") ?? ""),
    descriptionEn: sanitizeRichText(String(formData.get("descriptionEn") ?? "")),
    descriptionAr: sanitizeRichText(String(formData.get("descriptionAr") ?? "")),
    instructionsEn: sanitizeRichText(String(formData.get("instructionsEn") ?? "")),
    instructionsAr: sanitizeRichText(String(formData.get("instructionsAr") ?? "")),
    categoryId: String(formData.get("categoryId") ?? ""),
    platformId: String(formData.get("platformId") ?? ""),
    kind: String(formData.get("kind") ?? "DIGITAL_CODE"),
    fulfillmentType: String(formData.get("fulfillmentType") ?? "CODE"),
    brand: String(formData.get("brand") ?? ""),
    artworkKey: String(formData.get("artworkKey") ?? "digital"),
    featured: formBool(formData, "featured"),
    bestseller: formBool(formData, "bestseller"),
    refundable: formBool(formData, "refundable"),
    seoTitle: String(formData.get("seoTitle") ?? "") || undefined,
    seoDescription: String(formData.get("seoDescription") ?? "") || undefined,
    publish: formBool(formData, "publish"),
  });
  const id = parsed.slug;
  const product = await prisma.product.create({
    data: {
      id,
      slug: parsed.slug,
      kind: parsed.kind,
      fulfillmentType: parsed.fulfillmentType,
      categoryId: parsed.categoryId,
      platformId: parsed.platformId,
      brand: parsed.brand,
      artworkKey: parsed.artworkKey,
      featured: parsed.featured ?? false,
      bestseller: parsed.bestseller ?? false,
      refundable: parsed.refundable ?? false,
      seoTitle: parsed.seoTitle,
      seoDescription: parsed.seoDescription,
      status: parsed.publish ? "PUBLISHED" : "DRAFT",
      translations: {
        create: [
          {
            locale: "en",
            name: parsed.nameEn,
            shortDescription: parsed.shortEn,
            description: parsed.descriptionEn,
            instructions: parsed.instructionsEn,
            howToUse: [],
            regionRestrictions: "",
            refundPolicy: "",
          },
          {
            locale: "ar",
            name: parsed.nameAr,
            shortDescription: parsed.shortAr,
            description: parsed.descriptionAr,
            instructions: parsed.instructionsAr,
            howToUse: [],
            regionRestrictions: "",
            refundPolicy: "",
          },
        ],
      },
    },
  });
  const priceJod = Number(formData.get("variantPriceJod") ?? 0);
  const costJod = Number(formData.get("variantCostJod") ?? 0);
  const variantName = String(formData.get("variantName") ?? parsed.nameEn);
  if (priceJod > 0) {
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: String(formData.get("variantSku") ?? `${parsed.slug}-1`).toUpperCase(),
        denomination: Number(formData.get("variantDenomination") ?? priceJod),
        packageValue: variantName,
        packageCurrency: String(formData.get("variantCurrency") ?? "USD"),
        costFils: jodToFils(costJod),
        priceFils: jodToFils(priceJod),
        translations: {
          create: [
            { locale: "en", name: variantName },
            { locale: "ar", name: String(formData.get("variantNameAr") ?? variantName) },
          ],
        },
      },
    });
  }
  await writeAudit({
    actorId: user.id,
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    after: { slug: product.slug, status: product.status },
    ...(await requestMeta()),
  });
  revalidateStorefront();
  redirect(`/admin/catalog/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.catalogWrite);
  const id = String(formData.get("id") ?? "");
  const parsed = productFormSchema.parse({
    id,
    slug: String(formData.get("slug") ?? ""),
    nameEn: String(formData.get("nameEn") ?? ""),
    nameAr: String(formData.get("nameAr") ?? ""),
    shortEn: String(formData.get("shortEn") ?? ""),
    shortAr: String(formData.get("shortAr") ?? ""),
    descriptionEn: sanitizeRichText(String(formData.get("descriptionEn") ?? "")),
    descriptionAr: sanitizeRichText(String(formData.get("descriptionAr") ?? "")),
    instructionsEn: sanitizeRichText(String(formData.get("instructionsEn") ?? "")),
    instructionsAr: sanitizeRichText(String(formData.get("instructionsAr") ?? "")),
    categoryId: String(formData.get("categoryId") ?? ""),
    platformId: String(formData.get("platformId") ?? ""),
    kind: String(formData.get("kind") ?? "DIGITAL_CODE"),
    fulfillmentType: String(formData.get("fulfillmentType") ?? "CODE"),
    brand: String(formData.get("brand") ?? ""),
    artworkKey: String(formData.get("artworkKey") ?? "digital"),
    featured: formBool(formData, "featured"),
    bestseller: formBool(formData, "bestseller"),
    refundable: formBool(formData, "refundable"),
    seoTitle: String(formData.get("seoTitle") ?? "") || undefined,
    seoDescription: String(formData.get("seoDescription") ?? "") || undefined,
  });
  const before = await prisma.product.findUnique({ where: { id }, include: { translations: true } });
  await prisma.product.update({
    where: { id },
    data: {
      slug: parsed.slug,
      kind: parsed.kind,
      fulfillmentType: parsed.fulfillmentType,
      categoryId: parsed.categoryId,
      platformId: parsed.platformId,
      brand: parsed.brand,
      artworkKey: parsed.artworkKey,
      featured: parsed.featured ?? false,
      bestseller: parsed.bestseller ?? false,
      refundable: parsed.refundable ?? false,
      seoTitle: parsed.seoTitle,
      seoDescription: parsed.seoDescription,
    },
  });
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: id, locale: "en" } },
    update: {
      name: parsed.nameEn,
      shortDescription: parsed.shortEn,
      description: parsed.descriptionEn,
      instructions: parsed.instructionsEn,
    },
    create: {
      productId: id,
      locale: "en",
      name: parsed.nameEn,
      shortDescription: parsed.shortEn,
      description: parsed.descriptionEn,
      instructions: parsed.instructionsEn,
      howToUse: [],
      regionRestrictions: "",
      refundPolicy: "",
    },
  });
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: id, locale: "ar" } },
    update: {
      name: parsed.nameAr,
      shortDescription: parsed.shortAr,
      description: parsed.descriptionAr,
      instructions: parsed.instructionsAr,
    },
    create: {
      productId: id,
      locale: "ar",
      name: parsed.nameAr,
      shortDescription: parsed.shortAr,
      description: parsed.descriptionAr,
      instructions: parsed.instructionsAr,
      howToUse: [],
      regionRestrictions: "",
      refundPolicy: "",
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "product.edit",
    entityType: "Product",
    entityId: id,
    before: { slug: before?.slug },
    after: { slug: parsed.slug },
    ...(await requestMeta()),
  });
  revalidateStorefront();
  revalidatePath(`/admin/catalog/${id}`);
}

export async function addProductVariant(formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.catalogWrite);
  const productId = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "");
  const sku = String(formData.get("sku") ?? "").toUpperCase();
  const priceFils = jodToFils(Number(formData.get("priceJod") ?? 0));
  const costFils = jodToFils(Number(formData.get("costJod") ?? 0));
  if (!productId || !sku || !name || priceFils <= 0) throw new Error("Variant fields are incomplete.");
  const variant = await prisma.productVariant.create({
    data: {
      productId,
      sku,
      denomination: Number(formData.get("denomination") ?? 0),
      packageValue: name,
      packageCurrency: String(formData.get("currency") ?? "USD"),
      costFils,
      priceFils,
      compareAtPriceFils: formData.get("compareAtJod") ? jodToFils(Number(formData.get("compareAtJod"))) : null,
      manualPriceOverride: formBool(formData, "manualPriceOverride"),
      translations: {
        create: [
          { locale: "en", name },
          { locale: "ar", name: String(formData.get("nameAr") ?? name) },
        ],
      },
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "product.variant",
    entityType: "ProductVariant",
    entityId: variant.id,
    after: { sku, priceFils },
  });
  revalidateStorefront();
  revalidatePath(`/admin/catalog/${productId}`);
}

export async function updateVariantPrice(formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.pricingWrite);
  const variantId = String(formData.get("variantId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const priceFils = jodToFils(Number(formData.get("priceJod") ?? 0));
  const costFils = jodToFils(Number(formData.get("costJod") ?? 0));
  const before = await prisma.productVariant.findUnique({ where: { id: variantId } });
  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      priceFils,
      costFils,
      manualPriceOverride: true,
      automaticPricing: false,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "pricing.variant",
    entityType: "ProductVariant",
    entityId: variantId,
    before: { priceFils: before?.priceFils },
    after: { priceFils, locked: true },
  });
  revalidateStorefront();
  revalidatePath(`/admin/catalog/${productId}`);
}

export async function uploadProductArtwork(productId: string, formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.mediaWrite);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("No image selected.");
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storage().put({ buffer, mimeType: file.type, originalName: file.name });
  const asset = await prisma.mediaAsset.create({
    data: {
      filename: "upload",
      storedName: stored.storedName,
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
      url: stored.url,
    },
  });
  await prisma.productMedia.create({
    data: { productId, assetId: asset.id, url: stored.url, alt: String(formData.get("alt") ?? "Product artwork") },
  });
  await writeAudit({
    actorId: user.id,
    action: "media.upload",
    entityType: "Product",
    entityId: productId,
    after: { storedName: stored.storedName, mimeType: stored.mimeType },
  });
  revalidateStorefront();
  revalidatePath(`/admin/catalog/${productId}`);
  revalidatePath("/admin/media");
}

export async function duplicateProduct(productId: string) {
  const user = await requireAdmin(PERMISSIONS.catalogWrite);
  const source = await prisma.product.findUnique({
    where: { id: productId },
    include: { translations: true, variants: { include: { translations: true } }, fields: { include: { options: true } } },
  });
  if (!source) throw new Error("Product not found");
  const slug = `${source.slug}-copy-${nanoid(4).toLowerCase()}`;
  const copy = await prisma.product.create({
    data: {
      id: slug,
      slug,
      kind: source.kind,
      fulfillmentType: source.fulfillmentType,
      categoryId: source.categoryId,
      platformId: source.platformId,
      brand: source.brand,
      artworkKey: source.artworkKey,
      status: "DRAFT",
      featured: false,
      bestseller: false,
      refundable: source.refundable,
      translations: {
        create: source.translations.map((row) => ({
          locale: row.locale,
          name: `${row.name} copy`,
          shortDescription: row.shortDescription,
          description: row.description,
          instructions: row.instructions,
          howToUse: row.howToUse,
          regionRestrictions: row.regionRestrictions,
          refundPolicy: row.refundPolicy,
        })),
      },
    },
  });
  await writeAudit({ actorId: user.id, action: "product.duplicate", entityType: "Product", entityId: copy.id, after: { from: productId } });
  redirect(`/admin/catalog/${copy.id}`);
}

export async function createBanner(formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.contentWrite);
  const titleEn = String(formData.get("titleEn") ?? "");
  const titleAr = String(formData.get("titleAr") ?? titleEn);
  const href = String(formData.get("href") ?? "/shop");
  const banner = await prisma.banner.create({
    data: {
      href,
      kicker: String(formData.get("kicker") ?? ""),
      tone: String(formData.get("tone") ?? "gold"),
      placement: "HOME",
      published: formBool(formData, "published"),
      translations: {
        create: [
          {
            locale: "en",
            title: titleEn,
            subtitle: String(formData.get("subtitleEn") ?? ""),
            ctaLabel: String(formData.get("ctaEn") ?? "Shop"),
          },
          {
            locale: "ar",
            title: titleAr,
            subtitle: String(formData.get("subtitleAr") ?? ""),
            ctaLabel: String(formData.get("ctaAr") ?? "تسوق"),
          },
        ],
      },
    },
  });
  const desktop = formData.get("desktop");
  if (desktop instanceof File && desktop.size > 0) {
    const stored = await storage().put({
      buffer: Buffer.from(await desktop.arrayBuffer()),
      mimeType: desktop.type,
      originalName: desktop.name,
    });
    await prisma.banner.update({ where: { id: banner.id }, data: { desktopImage: stored.url } });
  }
  const mobile = formData.get("mobile");
  if (mobile instanceof File && mobile.size > 0) {
    const stored = await storage().put({
      buffer: Buffer.from(await mobile.arrayBuffer()),
      mimeType: mobile.type,
      originalName: mobile.name,
    });
    await prisma.banner.update({ where: { id: banner.id }, data: { mobileImage: stored.url } });
  }
  await writeAudit({ actorId: user.id, action: "banner.create", entityType: "Banner", entityId: banner.id, after: { href } });
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function duplicateBanner(id: string) {
  const user = await requireAdmin(PERMISSIONS.contentWrite);
  const source = await prisma.banner.findUnique({ where: { id }, include: { translations: true } });
  if (!source) throw new Error("Banner not found");
  const copy = await prisma.banner.create({
    data: {
      href: source.href,
      kicker: source.kicker,
      tone: source.tone,
      placement: source.placement,
      published: false,
      desktopImage: source.desktopImage,
      mobileImage: source.mobileImage,
      translations: {
        create: source.translations.map((row) => ({
          locale: row.locale,
          title: `${row.title} copy`,
          subtitle: row.subtitle,
          ctaLabel: row.ctaLabel,
        })),
      },
    },
  });
  await writeAudit({ actorId: user.id, action: "banner.duplicate", entityType: "Banner", entityId: copy.id });
  revalidatePath("/admin/banners");
}

export async function archiveBanner(id: string) {
  const user = await requireAdmin(PERMISSIONS.contentWrite);
  await prisma.banner.update({ where: { id }, data: { published: false } });
  await writeAudit({ actorId: user.id, action: "banner.archive", entityType: "Banner", entityId: id });
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

export async function setCategoryStatus(id: string, status: PublishStatus) {
  const user = await requireAdmin(PERMISSIONS.catalogWrite);
  const count = await prisma.product.count({ where: { categoryId: id, status: "PUBLISHED" } });
  if (status === "ARCHIVED" && count > 0) throw new Error("Reassign products before archiving this category.");
  await prisma.category.update({ where: { id }, data: { status } });
  await writeAudit({ actorId: user.id, action: "category.status", entityType: "Category", entityId: id, after: { status } });
  revalidateStorefront();
  revalidatePath("/admin/categories");
}

export async function revealDigitalCode(codeId: string) {
  const user = await requireAdmin(PERMISSIONS.codeReveal);
  const row = await prisma.digitalCode.findUnique({ where: { id: codeId } });
  if (!row) throw new Error("Code not found");
  const plaintext = decryptSecret({ ciphertext: row.ciphertext, iv: row.iv, authTag: row.authTag });
  await prisma.digitalCode.update({
    where: { id: codeId },
    data: { revealedAt: new Date(), revealedById: user.id },
  });
  await writeAudit({
    actorId: user.id,
    action: "code.reveal",
    entityType: "DigitalCode",
    entityId: codeId,
    after: { masked: row.masked, isTest: row.isTest },
    ...(await requestMeta()),
  });
  revalidatePath("/admin/integrations/1epin/test");
  return { masked: row.masked, demo: plaintext.startsWith("DEMO") || row.isTest ? plaintext : row.masked };
}

export async function createAdminAccount(formData: FormData) {
  const user = await requireAdmin(PERMISSIONS.adminWrite);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const role = String(formData.get("role") ?? "VIEWER") as AdminRole;
  const password = String(formData.get("password") ?? "");
  const strength = validatePasswordStrength(password);
  if (strength) throw new Error(strength);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("An account with that email already exists.");
  const created = await prisma.user.create({
    data: {
      email,
      name: String(formData.get("name") ?? email),
      kind: "ADMIN",
      passwordHash: await hashPassword(password),
      adminProfile: { create: { role, title: role } },
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "admin.create",
    entityType: "User",
    entityId: created.id,
    after: { email, role },
  });
  revalidatePath("/admin/administrators");
}
