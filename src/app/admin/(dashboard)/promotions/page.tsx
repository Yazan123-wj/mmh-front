import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function PromotionsPage() {
  await requireAdmin(PERMISSIONS.pricingWrite);
  const promotions = await prisma.promotion.findMany();
  const coupons = await prisma.coupon.findMany();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Promotions</h1>
      <p className="text-sm text-[#616674]">{promotions.length} promotions · {coupons.length} coupons</p>
    </div>
  );
}
