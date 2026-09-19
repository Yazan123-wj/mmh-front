import { CustomersListClient } from "@/components/admin/modules/customers-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("customers.read");
  return <CustomersListClient  />;
}
