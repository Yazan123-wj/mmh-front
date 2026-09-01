import { describe, expect, it, vi, beforeEach } from "vitest";
import { enrichCatalog } from "@/server/catalog/enrich";
import { PRODUCTS } from "@/data/products";

const prismaMock = vi.hoisted(() => ({
  product: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  productTranslation: { update: vi.fn() },
  productMedia: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  mediaAsset: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  regionTranslation: { updateMany: vi.fn() },
}));

vi.mock("@/server/db", () => ({ prisma: prismaMock }));

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="8"/></svg>`;

function dbProduct(id: string, media: unknown[] = []) {
  return {
    id,
    slug: PRODUCTS.find((item) => item.id === id)?.slug ?? id,
    media,
  };
}

describe("catalog enrichment import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue(PRODUCTS.map((item) => dbProduct(item.id)));
    prismaMock.product.update.mockResolvedValue({});
    prismaMock.productTranslation.update.mockResolvedValue({});
    prismaMock.regionTranslation.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.mediaAsset.findMany.mockResolvedValue([]);
    prismaMock.mediaAsset.upsert.mockImplementation(async ({ create }: { create: { storedName: string } }) => ({
      id: `asset-${create.storedName}`,
      ...create,
    }));
    prismaMock.productMedia.findFirst.mockResolvedValue(null);
    prismaMock.productMedia.create.mockResolvedValue({});
  });

  it("dry-run does not write products, media, or prices", async () => {
    const writes: string[] = [];
    const summary = await enrichCatalog({
      dryRun: true,
      fetchLogo: async () => ({ buffer: Buffer.from(logoSvg), mimeType: "image/svg+xml", finalUrl: "https://upload.wikimedia.org/x.svg" }),
      writePublicFile: async () => {
        writes.push("file");
      },
    });
    expect(summary.dryRun).toBe(true);
    expect(summary.products).toHaveLength(PRODUCTS.length);
    expect(prismaMock.product.update).not.toHaveBeenCalled();
    expect(prismaMock.mediaAsset.upsert).not.toHaveBeenCalled();
    expect(prismaMock.productMedia.create).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
    expect(JSON.stringify(summary)).not.toMatch(/priceFils/);
  });

  it("updates matching products, upserts media, and never writes variant prices", async () => {
    const files = new Map<string, string>();
    await enrichCatalog({
      dryRun: false,
      now: new Date("2026-09-01T15:00:00.000Z"),
      publicDir: "/tmp/mmh-catalog-test-public",
      backupDir: "/tmp/mmh-catalog-test-backup",
      logPath: "/tmp/mmh-catalog-artwork-log.json",
      fetchLogo: async () => ({ buffer: Buffer.from(logoSvg), mimeType: "image/svg+xml", finalUrl: "https://upload.wikimedia.org/x.svg" }),
      writePublicFile: async (relativePath, contents) => {
        files.set(relativePath, contents);
      },
    });
    expect(prismaMock.product.update).toHaveBeenCalledTimes(PRODUCTS.length);
    for (const call of prismaMock.product.update.mock.calls) {
      expect(call[0].data).not.toHaveProperty("priceFils");
      expect(call[0].data.rating).toBe(0);
      expect(call[0].data.reviewCount).toBe(0);
    }
    expect(prismaMock.mediaAsset.upsert.mock.calls.length).toBe(PRODUCTS.length);
    expect(files.size).toBe(PRODUCTS.length);
    expect(files.get("catalog/psn-store.svg")).toContain("<svg");
    expect(prismaMock.product.findMany.mock.calls.some((call) => JSON.stringify(call).includes("deleteMany"))).toBe(false);
  });

  it("is idempotent and skips admin-managed artwork", async () => {
    prismaMock.product.findMany.mockResolvedValue([
      dbProduct("psn-store", [
        {
          url: "/api/media/custom.png",
          asset: { storedName: "custom.png", mimeType: "image/png" },
        },
      ]),
      ...PRODUCTS.filter((item) => item.id !== "psn-store").map((item) =>
        dbProduct(item.id, [
          {
            url: `/catalog/${item.id}.svg`,
            asset: { storedName: `catalog-${item.id}.svg`, mimeType: "image/svg+xml" },
          },
        ]),
      ),
    ]);
    prismaMock.productMedia.findFirst.mockResolvedValue({ id: "media-1" });
    const summary = await enrichCatalog({
      dryRun: false,
      backupDir: "/tmp/mmh-catalog-test-backup-2",
      logPath: "/tmp/mmh-catalog-artwork-log-2.json",
      fetchLogo: async () => ({ buffer: Buffer.from(logoSvg), mimeType: "image/svg+xml", finalUrl: "https://upload.wikimedia.org/x.svg" }),
      writePublicFile: async () => undefined,
    });
    const psn = summary.products.find((item) => item.productId === "psn-store");
    expect(psn?.artwork).toBe("skip-admin");
    expect(prismaMock.productMedia.create).not.toHaveBeenCalled();
    expect(prismaMock.productMedia.update).toHaveBeenCalled();
  });
});
