import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/server/db";
import { PRODUCTS } from "@/data/products";
import { adminCustomArtworkLocked } from "@/server/catalog/enrich";
import { catalogPublicPath, catalogStoredName, isCatalogManagedStoredName } from "@/server/catalog/artwork-sources";
import { readImageSize } from "@/server/image";
import { fetchOneEpinImage } from "@/server/media/safe-fetch";
import {
  ONEEPIN_PRODUCTS_PAGE,
  buildOneEpinImagePlan,
  parseOneEpinCatalogHtml,
  type OneEpinCatalogEntry,
} from "@/server/suppliers/1epin/catalog-images";
import { credentialsConfigured, resolveOneEpinConfig } from "@/server/suppliers/1epin/config";
import { createOneEpinClient } from "@/server/suppliers/1epin/client";
import { CATALOG_FETCH_USER_AGENT } from "@/server/media/safe-fetch";

export interface ImportOneEpinImagesOptions {
  dryRun: boolean;
  now?: Date;
  fetchPage?: (url: string) => Promise<string>;
  fetchImage?: (filename: string) => Promise<{ buffer: Buffer; mimeType: string; finalUrl: string; ext: string }>;
  publicDir?: string;
  backupDir?: string;
  logPath?: string;
}

export interface OneEpinImageImportPlan {
  productId: string;
  slug: string;
  action: "import" | "skip-admin" | "skip-missing-product" | "skip-no-match" | "skip-download-error";
  categoryName?: string;
  imageFile?: string;
  sourceUrl?: string;
  notes: string[];
}

export interface OneEpinImageImportSummary {
  dryRun: boolean;
  retrievedAt: string;
  catalogSource: string;
  apiCredentials: "configured" | "not_configured";
  products: OneEpinImageImportPlan[];
  backupPath?: string;
  logPath?: string;
}

async function defaultFetchPage(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": CATALOG_FETCH_USER_AGENT, Accept: "text/html" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Could not load 1Epin products page (${response.status}).`);
  return response.text();
}

async function loadCatalog(fetchPage: ImportOneEpinImagesOptions["fetchPage"]): Promise<{ entries: OneEpinCatalogEntry[]; source: string }> {
  if (credentialsConfigured()) {
    try {
      const client = createOneEpinClient(resolveOneEpinConfig());
      const categories = await client.categoryInfo();
      const entries: OneEpinCatalogEntry[] = categories
        .filter((item) => item.imageUrl)
        .map((item) => {
          const file = item.imageUrl?.split("/").pop() ?? "";
          return {
            categoryId: item.categoryId,
            slug: item.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            href: `/products/category/${item.categoryId}`,
            imageFile: file,
            name: item.categoryName,
          };
        })
        .filter((item) => item.imageFile);
      if (entries.length > 0) {
        return { entries, source: "1Epin test API categoryInfo (read-only; no orders placed)" };
      }
    } catch {
      // Fall back to public products page.
    }
  }
  const html = await (fetchPage ?? defaultFetchPage)(ONEEPIN_PRODUCTS_PAGE);
  return {
    entries: parseOneEpinCatalogHtml(html),
    source: "1Epin public products page HTML (www.1epin.com/products/)",
  };
}

export async function planOneEpinImageImport(catalog: OneEpinCatalogEntry[]): Promise<OneEpinImageImportPlan[]> {
  const rows = await prisma.product.findMany({ include: { media: { include: { asset: true } } } });
  const byId = new Map(rows.map((row) => [row.id, row]));
  const plans = buildOneEpinImagePlan(catalog);

  return plans.map((plan) => {
    const row = byId.get(plan.productId);
    if (!row) {
      return {
        productId: plan.productId,
        slug: plan.slug,
        action: "skip-missing-product" as const,
        notes: ["Product exists in fallback catalog only."],
      };
    }
    const locked = adminCustomArtworkLocked(
      row.media.map((item) => ({
        storedName: item.asset?.storedName,
        mimeType: item.asset?.mimeType,
        url: item.url,
        artworkKind: item.asset?.artworkKind,
      })),
    );
    if (locked) {
      return {
        productId: plan.productId,
        slug: plan.slug,
        action: "skip-admin" as const,
        notes: ["Custom admin upload detected — not overwritten."],
      };
    }
    if (!plan.matched || !plan.imageFile) {
      return {
        productId: plan.productId,
        slug: plan.slug,
        action: "skip-no-match" as const,
        notes: ["No matching 1Epin category image was found."],
      };
    }
    return {
      productId: plan.productId,
      slug: plan.slug,
      action: "import" as const,
      categoryName: plan.categoryName,
      imageFile: plan.imageFile,
      sourceUrl: plan.sourceUrl,
      notes: ["Variant prices and SKUs will not be changed.", "Supplier category artwork is not denomination-specific."],
    };
  });
}

async function backupCatalogMedia(backupDir: string) {
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `catalog-media-export-${stamp}.json`);
  const [products, mediaAssets] = await Promise.all([
    prisma.product.findMany({ include: { media: true, translations: true } }),
    prisma.mediaAsset.findMany(),
  ]);
  await writeFile(
    backupPath,
    JSON.stringify({ exportedAt: new Date().toISOString(), products, mediaAssets }, null, 2),
    "utf8",
  );
  return backupPath;
}

async function upsertSupplierImageAsset(input: {
  productId: string;
  ext: string;
  buffer: Buffer;
  mimeType: string;
  alt: string;
  sourceUrl: string;
  sourcePageUrl: string;
  permissionNote: string;
  categoryId?: string;
  categoryName?: string;
  retrievedAt: Date;
}) {
  const storedName = catalogStoredName(input.productId, input.ext);
  const url = catalogPublicPath(input.productId, input.ext);
  const dimensions = readImageSize(input.buffer, input.mimeType);
  const asset = await prisma.mediaAsset.upsert({
    where: { storedName },
    update: {
      filename: storedName,
      mimeType: input.mimeType,
      byteSize: input.buffer.byteLength,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      url,
      sourceUrl: input.sourceUrl,
      sourcePageUrl: input.sourcePageUrl,
      retrievedAt: input.retrievedAt,
      license: "1Epin supplier catalog",
      permissionNote: input.permissionNote,
      artworkKind: "supplier-category",
      mappedProductId: input.productId,
    },
    create: {
      filename: storedName,
      storedName,
      mimeType: input.mimeType,
      byteSize: input.buffer.byteLength,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      url,
      sourceUrl: input.sourceUrl,
      sourcePageUrl: input.sourcePageUrl,
      retrievedAt: input.retrievedAt,
      license: "1Epin supplier catalog",
      permissionNote: input.permissionNote,
      artworkKind: "supplier-category",
      mappedProductId: input.productId,
    },
  });

  const staleManaged = await prisma.productMedia.findMany({
    where: {
      productId: input.productId,
      asset: { storedName: { startsWith: `catalog-${input.productId}.` } },
      NOT: { assetId: asset.id },
    },
    include: { asset: true },
  });
  for (const row of staleManaged) {
    if (row.asset && isCatalogManagedStoredName(row.asset.storedName) && row.asset.storedName !== storedName) {
      await prisma.productMedia.delete({ where: { id: row.id } });
    }
  }

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

export async function importOneEpinImages(options: ImportOneEpinImagesOptions): Promise<OneEpinImageImportSummary> {
  const retrievedAt = options.now ?? new Date();
  const publicDir = options.publicDir ?? path.join(process.cwd(), "public");
  const { entries, source } = await loadCatalog(options.fetchPage);
  const plans = await planOneEpinImageImport(entries);
  const summary: OneEpinImageImportSummary = {
    dryRun: options.dryRun,
    retrievedAt: retrievedAt.toISOString(),
    catalogSource: source,
    apiCredentials: credentialsConfigured() ? "configured" : "not_configured",
    products: plans,
  };

  if (options.dryRun) return summary;

  summary.backupPath = await backupCatalogMedia(options.backupDir ?? path.join(process.cwd(), "storage", "backups"));
  const logEntries: unknown[] = [];
  const productById = new Map(PRODUCTS.map((item) => [item.id, item]));

  for (const plan of plans) {
    if (plan.action !== "import" || !plan.imageFile) continue;
    const product = productById.get(plan.productId);
    if (!product) continue;
    try {
      const remote = await (options.fetchImage ?? fetchOneEpinImage)(plan.imageFile);
      const relative = `catalog/${plan.productId}.${remote.ext}`;
      await mkdir(path.join(publicDir, "catalog"), { recursive: true });
      await writeFile(path.join(publicDir, relative), remote.buffer);
      await upsertSupplierImageAsset({
        productId: plan.productId,
        ext: remote.ext,
        buffer: remote.buffer,
        mimeType: remote.mimeType,
        alt: `${product.name} — supplier category artwork from 1Epin. Generic category image, not denomination-specific.`,
        sourceUrl: remote.finalUrl,
        sourcePageUrl: ONEEPIN_PRODUCTS_PAGE,
        permissionNote:
          "Supplier category artwork from 1Epin. Category-level identification only; not denomination-specific. Confirm reuse with your 1Epin account terms.",
        categoryId: plan.categoryName,
        categoryName: plan.categoryName,
        retrievedAt,
      });
      logEntries.push({ ...plan, url: catalogPublicPath(plan.productId, remote.ext), finalUrl: remote.finalUrl, byteSize: remote.buffer.byteLength });
    } catch (error) {
      plan.action = "skip-download-error";
      plan.notes.push(error instanceof Error ? error.message : "Download failed");
      logEntries.push({ ...plan, error: plan.notes.at(-1) });
    }
  }

  summary.products = plans;
  const logPath = options.logPath ?? path.join(process.cwd(), "docs", "catalog-1epin-images-log.json");
  await mkdir(path.dirname(logPath), { recursive: true });
  await writeFile(
    logPath,
    JSON.stringify({ retrievedAt: summary.retrievedAt, catalogSource: summary.catalogSource, assets: logEntries, products: plans }, null, 2),
    "utf8",
  );
  summary.logPath = logPath;
  return summary;
}
