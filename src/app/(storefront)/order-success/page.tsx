import { OrderSuccessView } from "@/components/checkout/order-success";
import { prisma } from "@/server/db";
import { auth } from "@/auth";
import { filsToJod } from "@/server/money";
import { decryptSecret } from "@/server/crypto/codes";

export const metadata = { title: "Order received" };

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const session = await auth().catch(() => null);
  const order = ref
    ? await prisma.order
        .findUnique({
          where: { id: ref },
          include: {
            items: {
              include: {
                customerFields: true,
                digitalCodes: true,
                variant: { include: { product: { select: { fulfillmentType: true } } } },
              },
            },
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        })
        .catch(() => null)
    : null;
  const allowed = order && (!order.userId || order.userId === session?.user?.id);
  const canReveal =
    Boolean(allowed) && order?.paymentStatus === "PAID" && order.fulfillmentStatus === "COMPLETED";

  const safe = allowed
    ? {
        number: order.number,
        totalJod: filsToJod(order.totalFils),
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        paymentMethod: order.payments[0]?.provider ?? "placeholder",
        items: order.items.map((item) => ({
          id: item.id,
          name: item.name,
          nameAr: item.nameAr,
          quantity: item.quantity,
          unitPriceJod: filsToJod(item.unitPriceFils),
          fulfillmentType: item.variant.product.fulfillmentType,
          fields: item.customerFields.map((field) => ({
            label: field.label,
            maskedValue: field.maskedValue,
          })),
          codes: canReveal
            ? item.digitalCodes.map((code) => {
                let value: string | undefined;
                try {
                  value = decryptSecret({
                    ciphertext: code.ciphertext,
                    iv: code.iv,
                    authTag: code.authTag,
                  });
                } catch {
                  value = undefined;
                }
                return { masked: code.masked, value };
              })
            : item.digitalCodes.map((code) => ({ masked: code.masked })),
        })),
      }
    : null;

  return <OrderSuccessView order={safe} />;
}
