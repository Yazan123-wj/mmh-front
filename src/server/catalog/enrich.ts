import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/server/db";
import { PRODUCTS } from "@/data/products";
import { CATALOG_ARTWORK, artworkForProduct, catalogPublicPath, catalogStoredName, isCatalogManagedStoredName } from "@/server/catalog/artwork-sources";
import { buildIdentificationTile } from "@/server/catalog/identification-tile";
import { fetchAllowlistedBinary, sanitizeSvg } from "@/server/media/safe-fetch";
import type { Product } from "@/types";

export interface EnrichOptions {
  dryRun: boolean;
  now?: Date;
  fetchLogo?: (url: string) => Promise<{ buffer: Buffer; mimeType: string; finalUrl: string }>;
  writePublicFile?: (relativePath: string, contents: string) => Promise<void>;
  publicDir?: string;
  backupDir?: string;
  logPath?: string;
}

export interface ProductPlan {
  productId: string;
  slug: string;
  action: "update" | "missing";
  copy: boolean;
  artwork: "create" | "update" | "skip-admin" | "skip-missing-product" | "name-only-fallback";
  preservePrices: true;
  notes: string[];
}

export interface EnrichSummary {
  dryRun: boolean;
  retrievedAt: string;
  supplierCatalog: string;
  products: ProductPlan[];
  backupPath?: string;
  logPath?: string;
}

const ADMIN_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function adminArtworkLocked(media: Array<{ storedName?: string | null; mimeType?: string | null; url: string; artworkKind?: string | null }>) {
  return media.some((item) => {
    if (item.artworkKind === "supplier-category") return true;
    return adminCustomArtworkLocked([item]);
  });
}

export function adminCustomArtworkLocked(media: Array<{ storedName?: string | null; mimeType?: string | null; url: string; artworkKind?: string | null }>) {
  return media.some((item) => {
    if (item.artworkKind === "supplier-category") return false;
    if (item.storedName && isCatalogManagedStoredName(item.storedName)) return false;
    if (item.url.startsWith("/catalog/")) return false;
    return ADMIN_IMAGE_TYPES.has(item.mimeType ?? "") || item.url.startsWith("/api/media/");
  });
}

export function copyPatchFromProduct(product: Product) {
  return {
    brand: product.brand,
    regionWarningEn: product.digitalOptions.regionWarning ?? null,
    regionWarningAr: product.digitalOptions.regionWarningAr ?? null,
    deliveryEstimateEn: product.digitalOptions.deliveryEstimate,
    deliveryEstimateAr: product.digitalOptions.deliveryEstimateAr,
    accountCurrency: product.digitalOptions.accountCurrency ?? null,
    en: {
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      instructions: product.digitalOptions.instructions,
      howToUse: product.digitalOptions.howToUse,
      regionRestrictions: product.digitalOptions.regionRestrictions,
      refundPolicy: product.digitalOptions.refundPolicyText,
    },
    ar: {
      name: product.nameAr,
      shortDescription: product.shortDescriptionAr,
      description: product.descriptionAr,
      instructions: product.digitalOptions.instructionsAr,
      howToUse: product.digitalOptions.howToUseAr,
      regionRestrictions: product.digitalOptions.regionRestrictionsAr,
      refundPolicy: product.digitalOptions.refundPolicyTextAr,
    },
  };
}

function publicFileWriter(publicDir: string) {
  return async (relativePath: string, contents: string) => {
    const abs = path.join(publicDir, relativePath);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, contents, "utf8");
  };
}

async function loadLogo(sourceUrl: string | undefined, fetchLogo: EnrichOptions["fetchLogo"]) {
  if (!sourceUrl) return undefined;
  const loader = fetchLogo ?? fetchAllowlistedBinary;
  const remote = await loader(sourceUrl);
  if (remote.mimeType !== "image/svg+xml") {
    throw new Error("Only SVG identification marks are accepted from remote sources.");
  }
  return sanitizeSvg(remote.buffer.toString("utf8"));
}

export async function planCatalogEnrichment(): Promise<ProductPlan[]> {
  const rows = await prisma.product.findMany({
    include: {
      media: { include: { asset: true } },
    },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return PRODUCTS.map((product) => {
    const row = byId.get(product.id);
    if (!row) {
      return {
        productId: product.id,
        slug: product.slug,
        action: "missing" as const,
        copy: false,
        artwork: "skip-missing-product" as const,
        preservePrices: true as const,
        notes: ["Product is in the fallback catalog but not in the database. Enrichment will not create it."],
      };
    }
    const locked = adminArtworkLocked(
      row.media.map((item) => ({
        storedName: item.asset?.storedName,
        mimeType: item.asset?.mimeType,
        url: item.url,
        artworkKind: item.asset?.artworkKind,
      })),
    );
    const source = artworkForProduct(product.id);
    const notes: string[] = ["Selling prices and variant SKUs will not be changed."];
    if (!source) notes.push("No permitted artwork source is configured.");
    else if (source.kind === "name-only-tile") notes.push("Official card photography is unavailable; using an MMH name-only tile.");
    else notes.push("Artwork is generic brand identification, not denomination-specific card photography.");
    return {
      productId: product.id,
      slug: product.slug,
      action: "update" as const,
      copy: true,
      artwork: locked ? ("skip-admin" as const) : source?.kind === "name-only-tile" ? ("name-only-fallback" as const) : ("update" as const),
      preservePrices: true as const,
      notes,
    };
  });
}

async function backupCatalog(backupDir: string) {
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `catalog-export-${stamp}.json`);
  const [products, mediaAssets] = await Promise.all([
    prisma.product.findMany({
      include: { translations: true, variants: { select: { id: true, sku: true, priceFils: true, compareAtPriceFils: true, manualPriceOverride: true, packageValue: true, packageCurrency: true, denomination: true, published: true } }, media: true },
    }),
    prisma.mediaAsset.findMany(),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    note: "Catalog backup for artwork enrichment. Redemption codes and credentials are not included.",
    products,
    mediaAssets,
  };
  await writeFile(backupPath, JSON.stringify(payload, null, 2), "utf8");
  return backupPath;
}

async function upsertCatalogAsset(input: {
  productId: string;
  svg: string;
  alt: string;
  source: NonNullable<ReturnType<typeof artworkForProduct>>;
  retrievedAt: Date;
  usedLogo: boolean;
}) {
  const storedName = catalogStoredName(input.productId);
  const url = catalogPublicPath(input.productId);
  const byteSize = Buffer.byteLength(input.svg);
  const asset = await prisma.mediaAsset.upsert({
    where: { storedName },
    update: {
      filename: storedName,
      mimeType: "image/svg+xml",
      byteSize,
      width: 720,
      height: 720,
      url,
      sourceUrl: input.usedLogo ? input.source.sourceUrl ?? null : null,
      sourcePageUrl: input.source.sourcePageUrl ?? null,
      retrievedAt: input.retrievedAt,
      license: input.usedLogo ? input.source.license ?? null : "MMH-original identification tile",
      permissionNote: input.source.permissionNote,
      artworkKind: input.usedLogo ? input.source.kind : "name-only-tile",
      mappedProductId: input.productId,
    },
    create: {
      filename: storedName,
      storedName,
      mimeType: "image/svg+xml",
      byteSize,
      width: 720,
      height: 720,
      url,
      sourceUrl: input.usedLogo ? input.source.sourceUrl ?? null : null,
      sourcePageUrl: input.source.sourcePageUrl ?? null,
      retrievedAt: input.retrievedAt,
      license: input.usedLogo ? input.source.license ?? null : "MMH-original identification tile",
      permissionNote: input.source.permissionNote,
      artworkKind: input.usedLogo ? input.source.kind : "name-only-tile",
      mappedProductId: input.productId,
    },
  });
  const existing = await prisma.productMedia.findFirst({
    where: { productId: input.productId, OR: [{ assetId: asset.id }, { url }] },
  });
  if (existing) {
    await prisma.productMedia.update({
      where: { id: existing.id },
      data: { assetId: asset.id, url, alt: input.alt, sortOrder: 0 },
    });
  } else {
    await prisma.productMedia.create({
      data: { productId: input.productId, assetId: asset.id, url, alt: input.alt, sortOrder: 0 },
    });
  }
}

export async function enrichCatalog(options: EnrichOptions): Promise<EnrichSummary> {
  const retrievedAt = options.now ?? new Date();
  const publicDir = options.publicDir ?? path.join(process.cwd(), "public");
  const writePublic = options.writePublicFile ?? publicFileWriter(publicDir);
  const plans = await planCatalogEnrichment();
  const summary: EnrichSummary = {
    dryRun: options.dryRun,
    retrievedAt: retrievedAt.toISOString(),
    supplierCatalog: "skipped: 1Epin credentials are not used in this enrichment pass (live purchasing stays locked; catalog image feed was not requested against the supplier).",
    products: plans,
  };

  if (options.dryRun) {
    return summary;
  }

  const backupDir = options.backupDir ?? path.join(process.cwd(), "storage", "backups");
  summary.backupPath = await backupCatalog(backupDir);

  await prisma.regionTranslation.updateMany({
    where: { region: { slug: "global" }, locale: "en" },
    data: { name: "In-game account" },
  });
  await prisma.regionTranslation.updateMany({
    where: { region: { slug: "global" }, locale: "ar" },
    data: { name: "حساب داخل اللعبة" },
  });

  const logEntries: unknown[] = [];

  for (const product of PRODUCTS) {
    const plan = plans.find((item) => item.productId === product.id);
    if (!plan || plan.action !== "update") continue;
    const patch = copyPatchFromProduct(product);
    await prisma.product.update({
      where: { id: product.id },
      data: {
        brand: patch.brand,
        regionWarningEn: patch.regionWarningEn,
        regionWarningAr: patch.regionWarningAr,
        deliveryEstimateEn: patch.deliveryEstimateEn,
        deliveryEstimateAr: patch.deliveryEstimateAr,
        accountCurrency: patch.accountCurrency,
        rating: 0,
        reviewCount: 0,
      },
    });
    await prisma.productTranslation.update({
      where: { productId_locale: { productId: product.id, locale: "en" } },
      data: patch.en,
    });
    await prisma.productTranslation.update({
      where: { productId_locale: { productId: product.id, locale: "ar" } },
      data: patch.ar,
    });

    if (plan.artwork === "skip-admin") {
      logEntries.push({ productId: product.id, artwork: "skipped-admin-upload", preservePrices: true });
      continue;
    }

    const source = artworkForProduct(product.id);
    if (!source) continue;
    let usedLogo = false;
    let svg: string;
    try {
      const logo = source.kind === "generic-identification" ? await loadLogo(source.sourceUrl, options.fetchLogo) : undefined;
      const built = buildIdentificationTile(source, logo);
      svg = built.svg;
      usedLogo = built.usedLogo;
      if (source.kind === "generic-identification" && !usedLogo) {
        plan.artwork = "name-only-fallback";
        plan.notes.push("Remote logo could not be used; stored a name-only tile instead.");
      }
    } catch (error) {
      const built = buildIdentificationTile({ ...source, kind: "name-only-tile" });
      svg = built.svg;
      usedLogo = false;
      plan.artwork = "name-only-fallback";
      plan.notes.push(`Logo fetch failed (${error instanceof Error ? error.message : "unknown"}); stored a name-only tile.`);
    }
    await writePublic(`catalog/${product.id}.svg`, svg);
    await upsertCatalogAsset({
      productId: product.id,
      svg,
      alt: source.alt,
      source,
      retrievedAt,
      usedLogo,
    });
    logEntries.push({
      productId: product.id,
      slug: product.slug,
      url: catalogPublicPath(product.id),
      sourceUrl: usedLogo ? source.sourceUrl ?? null : null,
      sourcePageUrl: source.sourcePageUrl ?? null,
      retrievedAt: retrievedAt.toISOString(),
      license: usedLogo ? source.license : "MMH-original identification tile",
      permissionNote: source.permissionNote,
      artworkKind: usedLogo ? source.kind : "name-only-tile",
      denominationSpecific: false,
      preservePrices: true,
    });
  }

  const logPath = options.logPath ?? path.join(process.cwd(), "docs", "catalog-artwork-log.json");
  await mkdir(path.dirname(logPath), { recursive: true });
  await writeFile(
    logPath,
    JSON.stringify(
      {
        retrievedAt: retrievedAt.toISOString(),
        supplierCatalog: summary.supplierCatalog,
        assets: logEntries,
        products: summary.products,
      },
      null,
      2,
    ),
    "utf8",
  );
  summary.logPath = logPath;
  return summary;
}

export function assertNoPriceWrites(calls: Array<{ model: string; action: string; data?: Record<string, unknown> }>) {
  for (const call of calls) {
    if (call.model === "productVariant" && call.data && ("priceFils" in call.data || "compareAtPriceFils" in call.data || "costFils" in call.data)) {
      throw new Error("Catalog enrichment must not write variant prices.");
    }
  }
}

export { CATALOG_ARTWORK };
