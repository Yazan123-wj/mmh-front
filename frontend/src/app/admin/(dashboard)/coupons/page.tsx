import { CouponsListClient } from "@/components/admin/modules/coupons-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("orders.read");
  return <CouponsListClient  />;
}
