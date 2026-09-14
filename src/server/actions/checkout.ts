"use server";

import { z } from "zod";
import { prisma } from "@/server/db";
import { filsToJod } from "@/server/money";
import { encryptSecret, maskSecret } from "@/server/crypto/codes";
import { nanoid } from "nanoid";

const checkoutSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(32),
  notes: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(8).max(200),
  couponCode: z.string().trim().max(64).optional(),
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

const couponCheckSchema = z.object({
  code: z.string().trim().min(1).max(64),
  items: z.array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1).max(5) })).min(1).max(20),
});

export async function validateStorefrontCoupon(input: unknown) {
  const parsed = couponCheckSchema.safeParse(input);
  if (!parsed.success) return { valid: false as const, discountJod: 0 };
  const coupon = await prisma.coupon.findUnique({
    where: { code: parsed.data.code.toUpperCase() },
    include: { promotion: { include: { products: true } } },
  });
  if (!coupon?.enabled) return { valid: false as const, discountJod: 0 };
  const now = new Date();
  if (
    coupon.promotion &&
    (!coupon.promotion.enabled ||
      (coupon.promotion.startsAt && coupon.promotion.startsAt > now) ||
      (coupon.promotion.endsAt && coupon.promotion.endsAt < now))
  ) {
    return { valid: false as const, discountJod: 0 };
  }
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: parsed.data.items.map((item) => item.variantId) }, published: true },
    select: { id: true, productId: true, priceFils: true },
  });
  const eligibleProducts = new Set(coupon.promotion?.products.map((item) => item.productId) ?? []);
  let eligibleFils = 0;
  for (const item of parsed.data.items) {
    const variant = variants.find((row) => row.id === item.variantId);
    if (!variant || (eligibleProducts.size && !eligibleProducts.has(variant.productId))) continue;
    eligibleFils += variant.priceFils * item.quantity;
  }
  const percentBps = coupon.percentBps ?? coupon.promotion?.percentBps ?? 0;
  const amountFils = coupon.amountFils ?? coupon.promotion?.amountFils ?? 0;
  const discountFils = Math.min(eligibleFils, amountFils || Math.floor((eligibleFils * percentBps) / 10_000));
  return discountFils > 0
    ? { valid: true as const, discountJod: filsToJod(discountFils) }
    : { valid: false as const, discountJod: 0 };
}

/** In mock mode, mark the storefront order paid and issue demo codes for CODE products. */
async function completeMockStorefrontOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { variant: { include: { product: { select: { fulfillmentType: true } } } }, digitalCodes: true } },
      payments: true,
    },
  });
  if (!order || order.paymentStatus === "PAID") return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        fulfillmentStatus: "COMPLETED",
        supplierStatus: "COMPLETED",
        history: {
          create: [
            { field: "paymentStatus", fromValue: order.paymentStatus, toValue: "PAID", reason: "mock_storefront_payment" },
            {
              field: "fulfillmentStatus",
              fromValue: order.fulfillmentStatus,
              toValue: "COMPLETED",
              reason: "mock_storefront_fulfillment",
            },
          ],
        },
      },
    });

    for (const payment of order.payments) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID",
          provider: "demo",
          events: { create: [{ type: "mock_paid", message: "Mock storefront payment accepted" }] },
        },
      });
    }

    for (const item of order.items) {
      if (item.variant.product.fulfillmentType !== "CODE") continue;
      if (item.digitalCodes.length > 0) continue;
      for (let index = 0; index < item.quantity; index += 1) {
        const pin = `DEMO-${nanoid(4).toUpperCase()}-${nanoid(4).toUpperCase()}`;
        const enc = encryptSecret(pin);
        await tx.digitalCode.create({
          data: {
            orderItemId: item.id,
            ...enc,
            masked: maskSecret(pin),
            fingerprint: `mock:${orderId}:${item.id}:${index}:${nanoid(6)}`,
            isTest: true,
          },
        });
      }
    }
  });
}

export async function createStorefrontOrder(input: unknown) {
  const parsed = checkoutSchema.parse(input);
  if (!process.env.DATABASE_URL) throw new Error("Checkout is unavailable because the database is not configured.");
  const { createPendingOrder } = await import("@/server/actions/admin");
  const result = await createPendingOrder(parsed);
  if ((process.env.SUPPLIER_MODE ?? "mock") === "mock") {
    await completeMockStorefrontOrder(result.id);
  }
  return result;
}
