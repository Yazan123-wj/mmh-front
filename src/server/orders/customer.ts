import type { CustomerOrderSummary } from "@/components/account/customer-account";
import { prisma } from "@/server/db";
import { filsToJod } from "@/server/money";

export async function loadCustomerOrders(userId: string): Promise<CustomerOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: { include: { variant: { include: { product: true } }, customerFields: true, digitalCodes: { select: { masked: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((order) => ({
    id: order.id,
    number: order.number,
    createdAt: order.createdAt.toISOString(),
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    totalJod: filsToJod(order.totalFils),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      nameAr: item.nameAr,
      quantity: item.quantity,
      fulfillmentType: item.variant.product.fulfillmentType,
      fields: item.customerFields.map((field) => ({ label: field.label, maskedValue: field.maskedValue })),
      codes: order.paymentStatus === "PAID" && order.fulfillmentStatus === "COMPLETED" ? item.digitalCodes : [],
    })),
  }));
}
