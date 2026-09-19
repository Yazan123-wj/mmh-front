import { SuppliersListClient } from "@/components/admin/modules/suppliers-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("suppliers.read");
  return <SuppliersListClient  />;
}
