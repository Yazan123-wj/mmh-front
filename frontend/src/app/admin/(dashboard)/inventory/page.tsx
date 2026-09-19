import { InventoryClient } from "@/components/admin/modules/inventory-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("codes.read");
  return <InventoryClient  />;
}
