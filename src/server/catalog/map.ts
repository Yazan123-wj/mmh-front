import { prisma } from "@/server/db";
import { filsToJod } from "@/server/money";
import { setCatalogSnapshot } from "@/lib/catalog-snapshot";
import type { Category, Product, ProductKind, RequiredCustomerField } from "@/types";
import type {
  Category as DbCategory,
  CategoryTranslation,
  Platform,
  PlatformTranslation,
  Product as DbProduct,
  ProductFieldDefinition,
  ProductFieldOption,
  ProductMedia,
  ProductTranslation,
  ProductVariant,
  ProductVariantTranslation,
  Region,
  RegionTranslation,
} from "@prisma/client";

type ProductRecord = DbProduct & {
  category: DbCategory & { translations: CategoryTranslation[] };
  platform: Platform & { translations: PlatformTranslation[] };
  translations: ProductTranslation[];
  variants: Array<
    ProductVariant & { translations: ProductVariantTranslation[]; region: (Region & { translations: RegionTranslation[] }) | null }
  >;
  media: ProductMedia[];
  fields: Array<ProductFieldDefinition & { options: ProductFieldOption[] }>;
};

const kindMap: Record<string, ProductKind> = {
  GIFT_CARD: "gift_card",
  WALLET: "wallet",
  GAME_CURRENCY: "game_currency",
  SUBSCRIPTION: "subscription",
  DIRECT_TOPUP: "direct_topup",
  DIGITAL_CODE: "digital_code",
};

export function mapCategory(row: DbCategory & { translations: CategoryTranslation[] }): Category {
  const en = row.translations.find((item) => item.locale === "en");
  const ar = row.translations.find((item) => item.locale === "ar");
  return {
    slug: row.slug,
    name: en?.name ?? row.slug,
    nameAr: ar?.name ?? en?.name ?? row.slug,
    description: en?.description ?? "",
    descriptionAr: ar?.description ?? "",
    href: row.href ?? `/category/${row.slug}`,
    artworkKey: row.artworkKey ?? "digital",
    parent: undefined,
  };
}

export function mapProduct(row: ProductRecord): Product {
  const en = row.translations.find((item) => item.locale === "en");
  const ar = row.translations.find((item) => item.locale === "ar");
  const variants = row.variants.filter((item) => item.published).sort((a, b) => a.sortOrder - b.sortOrder);
  const start = variants[0];
  const regions = new Map<string, { id: string; name: string; nameAr: string; locked: boolean; currency?: string }>();
  for (const variant of variants) {
    if (!variant.region) continue;
    const ren = variant.region.translations.find((item) => item.locale === "en");
    const rar = variant.region.translations.find((item) => item.locale === "ar");
    regions.set(variant.region.slug, {
      id: variant.region.slug,
      name: ren?.name ?? variant.region.slug,
      nameAr: rar?.name ?? ren?.name ?? variant.region.slug,
      locked: variant.region.locked,
      currency: variant.region.currency,
    });
  }
  const fields: RequiredCustomerField[] = row.fields
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((field) => ({
      id: field.key,
      label: field.labelEn,
      labelAr: field.labelAr,
      placeholder: field.placeholderEn,
      placeholderAr: field.placeholderAr,
      type: field.type === "EMAIL" ? "email" : field.type === "TEL" ? "tel" : field.type === "SELECT" ? "select" : "text",
      required: field.required,
      helpText: field.helpTextEn ?? undefined,
      helpTextAr: field.helpTextAr ?? undefined,
      options: field.options.map((option) => ({
        value: option.value,
        label: option.labelEn,
        labelAr: option.labelAr,
      })),
    }));
  const platformEn = row.platform.translations.find((item) => item.locale === "en")?.name ?? row.brand;
  const platformAr = row.platform.translations.find((item) => item.locale === "ar")?.name ?? platformEn;
  return {
    id: row.id,
    slug: row.slug,
    type: "digital",
    fulfillmentType: row.fulfillmentType === "DIRECT_TOPUP" ? "direct_topup" : "code",
    name: en?.name ?? row.slug,
    nameAr: ar?.name ?? en?.name ?? row.slug,
    shortDescription: en?.shortDescription ?? "",
    shortDescriptionAr: ar?.shortDescription ?? "",
    description: en?.description ?? "",
    descriptionAr: ar?.description ?? "",
    brand: row.brand,
    category: row.category.slug,
    images: row.media.sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.url),
    artworkKey: row.artworkKey,
    priceJod: start ? filsToJod(start.priceFils) : 0,
    compareAtPriceJod: start?.compareAtPriceFils ? filsToJod(start.compareAtPriceFils) : undefined,
    rating: Number(row.rating),
    reviewCount: row.reviewCount,
    badges: row.badges as Product["badges"],
    inStock: variants.some((item) => item.stockStatus === "IN_STOCK"),
    featured: row.featured,
    trending: row.trending,
    bestseller: row.bestseller,
    createdAt: row.createdAt.toISOString(),
    tags: row.tags,
    platform: row.platform.slug,
    digitalOptions: {
      platform: row.platform.slug,
      platformLabel: platformEn,
      platformLabelAr: platformAr,
      kind: kindMap[row.kind] ?? "digital_code",
      regions: Array.from(regions.values()),
      denominations: variants.map((variant) => {
        const ven = variant.translations.find((item) => item.locale === "en");
        const varl = variant.translations.find((item) => item.locale === "ar");
        return {
          id: variant.id,
          label: ven?.name ?? variant.packageValue,
          labelAr: varl?.name ?? ven?.name ?? variant.packageValue,
          value: Number(variant.denomination),
          currency: variant.packageCurrency,
          priceJod: filsToJod(variant.priceFils),
          compareAtPriceJod: variant.compareAtPriceFils ? filsToJod(variant.compareAtPriceFils) : undefined,
          inStock: variant.stockStatus === "IN_STOCK",
        };
      }),
      deliveryMethods: row.fulfillmentType === "DIRECT_TOPUP" ? ["account"] : ["email", "sms", "account"],
      deliveryEstimate: row.deliveryEstimateEn ?? "Usually minutes after payment.",
      deliveryEstimateAr: row.deliveryEstimateAr ?? "عادة خلال دقائق بعد الدفع.",
      instructions: en?.instructions ?? "",
      instructionsAr: ar?.instructions ?? "",
      howToUse: en?.howToUse ?? [],
      howToUseAr: ar?.howToUse ?? [],
      regionRestrictions: en?.regionRestrictions ?? "",
      regionRestrictionsAr: ar?.regionRestrictions ?? "",
      regionWarning: row.regionWarningEn ?? undefined,
      regionWarningAr: row.regionWarningAr ?? undefined,
      accountCurrency: row.accountCurrency ?? undefined,
      refundEligible: row.refundable,
      refundPolicyText: en?.refundPolicy ?? "",
      refundPolicyTextAr: ar?.refundPolicy ?? "",
      instantCode: row.fulfillmentType === "CODE",
      requiredCustomerFields: fields,
    },
  };
}

export async function loadPublishedCatalog() {
  return prisma.product.findMany({
    where: { status: "PUBLISHED" },
    include: {
      category: { include: { translations: true } },
      platform: { include: { translations: true } },
      translations: true,
      variants: { include: { translations: true, region: { include: { translations: true } } } },
      media: true,
      fields: { include: { options: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function loadPublishedCategories() {
  return prisma.category.findMany({
    where: { status: "PUBLISHED" },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function loadPublishedBanners() {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      published: true,
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] },
      ],
    },
    include: { translations: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function hydrateCatalogFromDb() {
  const [products, categories] = await Promise.all([loadPublishedCatalog(), loadPublishedCategories()]);
  const mapped = products.map(mapProduct);
  const mappedCats = categories.map(mapCategory);
  setCatalogSnapshot(mapped, mappedCats);
  return { products: mapped, categories: mappedCats };
}
