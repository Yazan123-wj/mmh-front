"use server";

import { PRODUCTS } from "@/data/products";
import { rateLimit } from "@/server/rate-limit";
import { nanoid } from "nanoid";
import { z } from "zod";

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

function createDemoOrder(parsed: z.infer<typeof checkoutSchema>) {
  for (const item of parsed.items) {
    const product = PRODUCTS.find((row) => row.id === item.productId);
    if (!product) throw new Error("Invalid item");
    const denomination = product.digitalOptions.denominations.find((row) => row.id === item.variantId);
    if (!denomination || denomination.inStock === false) throw new Error("Unavailable product");
    for (const field of product.digitalOptions.requiredCustomerFields) {
      if (!field.required) continue;
      const value = item.fields?.[field.id]?.trim() ?? "";
      if (!value) throw new Error("Required player fields are missing.");
    }
  }
  return {
    orderNumber: `MMH-${nanoid(8).toUpperCase()}`,
    id: `demo-${nanoid(10)}`,
    demo: true as const,
  };
}

/**
 * Storefront checkout for demos and production.
 * Falls back to a simulated order when DATABASE_URL / Auth are not configured (Vercel frontend preview).
 */
export async function createStorefrontOrder(input: unknown) {
  const parsed = checkoutSchema.parse(input);
  if (!rateLimit(`checkout:${parsed.email}`, 12, 10 * 60 * 1000)) {
    throw new Error("Too many checkout attempts. Try again later.");
  }

  if (process.env.DATABASE_URL) {
    try {
      const { createPendingOrder } = await import("@/server/actions/admin");
      const result = await createPendingOrder(parsed);
      return { ...result, demo: false as const };
    } catch {
      // Frontend preview often has static denomination IDs and no seeded DB — keep the demo flow working.
    }
  }

  return createDemoOrder(parsed);
}
