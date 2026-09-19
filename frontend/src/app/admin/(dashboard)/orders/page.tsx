import { OrdersListClient } from "@/components/admin/modules/orders-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("orders.read");
  return <OrdersListClient  />;
}
