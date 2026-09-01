import { PrismaClient, type AdminRole, type ProductKind } from "@prisma/client";
import { existsSync } from "fs";
import path from "path";
import { hashPassword, validatePasswordStrength } from "../src/server/auth/password";
import { jodToFils } from "../src/server/money";
import { encryptSecret, maskSecret } from "../src/server/crypto/codes";
import { PERMISSIONS, rolePermissions } from "../src/server/auth/permissions";
import { PRODUCTS } from "../src/data/products";
import { CATEGORIES } from "../src/data/categories";
import { PLATFORMS } from "../src/data/platforms";
import { REGIONS } from "../src/data/regions";
import { translations } from "../src/data/translations";
import { catalogPublicPath, catalogStoredName } from "../src/server/catalog/artwork-sources";

const prisma = new PrismaClient();

const KIND: Record<string, ProductKind> = {
  gift_card: "GIFT_CARD",
  wallet: "WALLET",
  game_currency: "GAME_CURRENCY",
  subscription: "SUBSCRIPTION",
  direct_topup: "DIRECT_TOPUP",
  digital_code: "DIGITAL_CODE",
};

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";
  if (!email || !password) throw new Error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD are required.");
  const strength = validatePasswordStrength(password);
  if (strength) throw new Error(strength);

  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { key: description },
      update: { description: key },
      create: { key: description, description: key },
    });
  }
  const permissions = await prisma.permission.findMany();
  const roles: AdminRole[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "CATALOG_MANAGER",
    "ORDER_MANAGER",
    "CONTENT_MANAGER",
    "SUPPORT_AGENT",
    "VIEWER",
  ];
  for (const role of roles) {
    for (const key of rolePermissions(role)) {
      const permission = permissions.find((item) => item.key === key);
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permission.id } },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, kind: "ADMIN", disabled: false, name: "Clicks Admin" },
    create: { email, passwordHash, kind: "ADMIN", name: "Clicks Admin" },
  });
  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    update: { role: "SUPER_ADMIN" },
    create: { userId: admin.id, role: "SUPER_ADMIN", title: "Super Admin" },
  });

  for (const platform of PLATFORMS) {
    await prisma.platform.upsert({
      where: { slug: platform.id },
      update: {},
      create: {
        slug: platform.id,
        artworkKey: `card-${platform.id}`,
        translations: {
          create: [
            { locale: "en", name: platform.name },
            { locale: "ar", name: platform.nameAr },
          ],
        },
      },
    });
  }

  for (const region of REGIONS) {
    await prisma.region.upsert({
      where: { slug: region.id },
      update: {},
      create: {
        slug: region.id,
        currency: region.currency,
        locked: region.locked,
        translations: {
          create: [
            { locale: "en", name: region.name },
            { locale: "ar", name: region.nameAr },
          ],
        },
      },
    });
  }

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { href: category.href, artworkKey: category.artworkKey },
      create: {
        slug: category.slug,
        href: category.href,
        artworkKey: category.artworkKey,
        translations: {
          create: [
            { locale: "en", name: category.name, description: category.description },
            { locale: "ar", name: category.nameAr, description: category.descriptionAr },
          ],
        },
      },
    });
  }

  const platforms = await prisma.platform.findMany();
  const regions = await prisma.region.findMany();
  const categories = await prisma.category.findMany();

  for (const product of PRODUCTS) {
    const platform = platforms.find((item) => item.slug === product.platform) ?? platforms[0];
    const category = categories.find((item) => item.slug === product.category) ?? categories[0];
    await prisma.product.upsert({
      where: { id: product.id },
      update: { status: "PUBLISHED", featured: Boolean(product.featured), bestseller: Boolean(product.bestseller), rating: 0, reviewCount: 0 },
      create: {
        id: product.id,
        slug: product.slug,
        kind: KIND[product.digitalOptions.kind],
        fulfillmentType: product.fulfillmentType === "direct_topup" ? "DIRECT_TOPUP" : "CODE",
        categoryId: category.id,
        platformId: platform.id,
        brand: product.brand,
        artworkKey: product.artworkKey,
        accountCurrency: product.digitalOptions.accountCurrency,
        status: "PUBLISHED",
        featured: Boolean(product.featured),
        bestseller: Boolean(product.bestseller),
        trending: Boolean(product.trending),
        refundable: product.digitalOptions.refundEligible,
        regionWarningEn: product.digitalOptions.regionWarning,
        regionWarningAr: product.digitalOptions.regionWarningAr,
        deliveryEstimateEn: product.digitalOptions.deliveryEstimate,
        deliveryEstimateAr: product.digitalOptions.deliveryEstimateAr,
        rating: product.rating,
        reviewCount: product.reviewCount,
        badges: product.badges,
        tags: product.tags,
        translations: {
          create: [
            {
              locale: "en",
              name: product.name,
              shortDescription: product.shortDescription,
              description: product.description,
              instructions: product.digitalOptions.instructions,
              howToUse: product.digitalOptions.howToUse,
              regionRestrictions: product.digitalOptions.regionRestrictions,
              refundPolicy: product.digitalOptions.refundPolicyText,
            },
            {
              locale: "ar",
              name: product.nameAr,
              shortDescription: product.shortDescriptionAr,
              description: product.descriptionAr,
              instructions: product.digitalOptions.instructionsAr,
              howToUse: product.digitalOptions.howToUseAr,
              regionRestrictions: product.digitalOptions.regionRestrictionsAr,
              refundPolicy: product.digitalOptions.refundPolicyTextAr,
            },
          ],
        },
        fields: {
          create: product.digitalOptions.requiredCustomerFields.map((field, index) => ({
            key: field.id,
            type: field.type === "email" ? "EMAIL" : field.type === "tel" ? "TEL" : field.type === "select" ? "SELECT" : "TEXT",
            required: field.required,
            sortOrder: index,
            labelEn: field.label,
            labelAr: field.labelAr,
            placeholderEn: field.placeholder,
            placeholderAr: field.placeholderAr,
            helpTextEn: field.helpText,
            helpTextAr: field.helpTextAr,
          })),
        },
      },
    });

    for (const denomination of product.digitalOptions.denominations) {
      const regionList = product.digitalOptions.regions.length ? product.digitalOptions.regions : [{ id: "global" }];
      for (const region of regionList) {
        const dbRegion = regions.find((item) => item.slug === region.id);
        const sku = `${product.id}-${region.id}-${denomination.id}`.slice(0, 64);
        const priceFils = jodToFils(denomination.priceJod);
        const compare = denomination.compareAtPriceJod ? jodToFils(denomination.compareAtPriceJod) : null;
        const costFils = Number((BigInt(priceFils) * BigInt(78)) / BigInt(100));
        const existingVariant = await prisma.productVariant.findUnique({ where: { sku } });
        await prisma.productVariant.upsert({
          where: { sku },
          update: existingVariant?.manualPriceOverride
            ? { published: denomination.inStock !== false }
            : { priceFils, compareAtPriceFils: compare, published: denomination.inStock !== false },
          create: {
            productId: product.id,
            regionId: dbRegion?.id,
            sku,
            denomination: denomination.value,
            packageValue: denomination.label,
            packageCurrency: denomination.currency,
            costFils,
            priceFils,
            compareAtPriceFils: compare,
            stockStatus: denomination.inStock === false ? "OUT_OF_STOCK" : "IN_STOCK",
            sortOrder: product.digitalOptions.denominations.indexOf(denomination),
            translations: {
              create: [
                { locale: "en", name: denomination.label },
                { locale: "ar", name: denomination.labelAr },
              ],
            },
          },
        });
      }
    }

    const catalogFile = path.join(process.cwd(), "public", "catalog", `${product.id}.svg`);
    if (existsSync(catalogFile)) {
      const storedName = catalogStoredName(product.id);
      const url = catalogPublicPath(product.id);
      const asset = await prisma.mediaAsset.upsert({
        where: { storedName },
        update: { url, mimeType: "image/svg+xml", mappedProductId: product.id },
        create: {
          filename: storedName,
          storedName,
          mimeType: "image/svg+xml",
          byteSize: 0,
          width: 720,
          height: 720,
          url,
          artworkKind: "generic-identification",
          mappedProductId: product.id,
          permissionNote: "See docs/catalog-artwork-log.json for source and permission notes.",
        },
      });
      const linked = await prisma.productMedia.findFirst({ where: { productId: product.id, url } });
      if (!linked) {
        await prisma.productMedia.create({
          data: { productId: product.id, assetId: asset.id, url, alt: product.name, sortOrder: 0 },
        });
      }
    }
  }

  const bannerSeed = [
    {
      id: "roblox",
      href: "/product/roblox-gift-card",
      kicker: "Roblox",
      tone: "gold",
      keys: ["banner.robloxTitle", "banner.robloxBody", "banner.robloxCta"],
    },
    {
      id: "pubg",
      href: "/product/pubg-mobile-uc",
      kicker: "PUBG Mobile",
      tone: "blue",
      keys: ["banner.pubgTitle", "banner.pubgBody", "banner.pubgCta"],
    },
    {
      id: "playstation",
      href: "/product/playstation-store-wallet",
      kicker: "PlayStation",
      tone: "blue",
      keys: ["banner.psTitle", "banner.psBody", "banner.psCta"],
    },
    {
      id: "steam",
      href: "/product/steam-wallet",
      kicker: "Steam",
      tone: "gold",
      keys: ["banner.steamTitle", "banner.steamBody", "banner.steamCta"],
    },
  ];
  for (const [index, banner] of bannerSeed.entries()) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: { published: true, sortOrder: index },
      create: {
        id: banner.id,
        href: banner.href,
        kicker: banner.kicker,
        tone: banner.tone,
        published: true,
        sortOrder: index,
        translations: {
          create: [
            {
              locale: "en",
              title: translations.en[banner.keys[0] as keyof typeof translations.en],
              subtitle: translations.en[banner.keys[1] as keyof typeof translations.en],
              ctaLabel: translations.en[banner.keys[2] as keyof typeof translations.en],
            },
            {
              locale: "ar",
              title: translations.ar[banner.keys[0] as keyof typeof translations.ar],
              subtitle: translations.ar[banner.keys[1] as keyof typeof translations.ar],
              ctaLabel: translations.ar[banner.keys[2] as keyof typeof translations.ar],
            },
          ],
        },
      },
    });
  }

  await prisma.pricingRule.deleteMany({ where: { type: "PERCENT_MARKUP" } });
  await prisma.pricingRule.create({
    data: { type: "PERCENT_MARKUP", percentBps: 2200, enabled: true },
  });
  await prisma.pricingRule.create({
    data: { type: "MINIMUM_MARGIN", minMarginBps: 800, enabled: true },
  });

  const supplier = await prisma.supplier.upsert({
    where: { slug: "1epin" },
    update: { environment: "MOCK", enabled: true },
    create: { slug: "1epin", name: "1Epin", environment: "MOCK", enabled: true },
  });
  await prisma.supplierConnection.deleteMany({ where: { supplierId: supplier.id } });
  await prisma.supplierConnection.create({
    data: {
      supplierId: supplier.id,
      environment: "MOCK",
      enabled: true,
      credentialConfigured: false,
      callbackConfigured: false,
      staticIpConfigured: false,
      lastSuccessAt: new Date(),
    },
  });
  await prisma.supplierProductMapping.upsert({
    where: { supplierId_externalProductId: { supplierId: supplier.id, externalProductId: "1epin-psn-50" } },
    update: { mapped: true, productId: "psn-store" },
    create: { supplierId: supplier.id, externalProductId: "1epin-psn-50", mapped: true, productId: "psn-store" },
  });
  await prisma.supplierProductMapping.upsert({
    where: { supplierId_externalProductId: { supplierId: supplier.id, externalProductId: "1epin-unmapped-99" } },
    update: { mapped: false },
    create: { supplierId: supplier.id, externalProductId: "1epin-unmapped-99", mapped: false },
  });

  const customer = await prisma.user.upsert({
    where: { email: "yazan@example.com" },
    update: {},
    create: { email: "yazan@example.com", name: "Yazan Amman", kind: "CUSTOMER" },
  });
  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: { phone: "+962 7X XXX XXXX" },
    create: { userId: customer.id, phone: "+962 7X XXX XXXX" },
  });

  const psnVariant = await prisma.productVariant.findFirst({ where: { productId: "psn-store" } });
  const pubgVariant = await prisma.productVariant.findFirst({ where: { productId: "pubg-uc" } });
  const robloxVariant = await prisma.productVariant.findFirst({ where: { productId: "roblox-card" } });
  if (psnVariant && pubgVariant && robloxVariant) {
    await seedOrder({
      number: "MMH-A7K2Q9",
      email: customer.email,
      fullName: "Yazan Amman",
      phone: "+962 7X XXX XXXX",
      userId: customer.id,
      paymentStatus: "PAID",
      fulfillmentStatus: "COMPLETED",
      supplierStatus: "COMPLETED",
      variant: psnVariant,
      name: "PlayStation Store Wallet Card",
      nameAr: "بطاقة محفظة بلايستيشن",
      withCode: true,
    });
    await seedOrder({
      number: "MMH-B3N8W1",
      email: customer.email,
      fullName: "Yazan Amman",
      phone: "+962 7X XXX XXXX",
      userId: customer.id,
      paymentStatus: "PAID",
      fulfillmentStatus: "PROCESSING",
      supplierStatus: "PROCESSING",
      variant: pubgVariant,
      name: "PUBG Mobile UC",
      nameAr: "شدات ببجي",
      player: "51••••82",
    });
    await seedOrder({
      number: "MMH-C9F4T2",
      email: customer.email,
      fullName: "Yazan Amman",
      phone: "+962 7X XXX XXXX",
      userId: customer.id,
      paymentStatus: "FAILED",
      fulfillmentStatus: "FAILED",
      supplierStatus: "FAILED",
      variant: robloxVariant,
      name: "Roblox Gift Card",
      nameAr: "بطاقة روبلوكس",
    });
    await seedOrder({
      number: "MMH-D2H6L0",
      email: "guest@example.com",
      fullName: "Guest Checkout",
      phone: "+962 79 000 0000",
      paymentStatus: "PENDING",
      fulfillmentStatus: "NOT_STARTED",
      supplierStatus: "NOT_SUBMITTED",
      variant: psnVariant,
      name: "PlayStation Store Wallet Card",
      nameAr: "بطاقة محفظة بلايستيشن",
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: "default_markup_bps" },
    update: { value: 2200 },
    create: { key: "default_markup_bps", value: 2200 },
  });

  console.log("Seed complete. Catalog products:", PRODUCTS.length);
}

async function seedOrder(input: {
  number: string;
  email: string;
  fullName: string;
  phone: string;
  userId?: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  fulfillmentStatus: "NOT_STARTED" | "PROCESSING" | "COMPLETED" | "FAILED";
  supplierStatus: "NOT_SUBMITTED" | "PROCESSING" | "COMPLETED" | "FAILED";
  variant: { id: string; productId: string; priceFils: number; costFils: number };
  name: string;
  nameAr: string;
  withCode?: boolean;
  player?: string;
}) {
  const existing = await prisma.order.findUnique({ where: { number: input.number } });
  if (existing) return;
  const total = input.variant.priceFils;
  await prisma.order.create({
    data: {
      number: input.number,
      userId: input.userId,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      subtotalFils: total,
      totalFils: total,
      paymentStatus: input.paymentStatus,
      fulfillmentStatus: input.fulfillmentStatus,
      supplierStatus: input.supplierStatus,
      idempotencyKey: `seed-${input.number}`,
      items: {
        create: {
          productId: input.variant.productId,
          variantId: input.variant.id,
          name: input.name,
          nameAr: input.nameAr,
          quantity: 1,
          unitPriceFils: total,
          lineTotalFils: total,
          costFils: input.variant.costFils,
          customerFields: input.player
            ? { create: [{ key: "playerId", label: "Player ID", value: "5182", maskedValue: input.player }] }
            : undefined,
          digitalCodes: input.withCode
            ? {
                create: (() => {
                  const enc = encryptSecret("DEMO-XXXX-XXXX");
                  return { ...enc, masked: maskSecret("DEMO-XXXX-XXXX") };
                })(),
              }
            : undefined,
        },
      },
      payments: {
        create: {
          status: input.paymentStatus,
          amountFils: total,
          provider: "placeholder",
          events: { create: [{ type: "seed", message: "Seeded payment event" }] },
        },
      },
      history: {
        create: [{ field: "paymentStatus", toValue: input.paymentStatus, reason: "seed" }],
      },
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
