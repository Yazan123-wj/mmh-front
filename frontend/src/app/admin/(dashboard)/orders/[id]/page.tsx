import { OrderDetailClient } from "@/components/admin/modules/order-detail-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("orders.read");
  const { id } = await params;
  return <OrderDetailClient id={id} />;
}
