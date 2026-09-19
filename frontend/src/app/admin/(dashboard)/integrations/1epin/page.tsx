import { OneEpinClient } from "@/components/admin/modules/oneepin-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("suppliers.read");
  return <OneEpinClient  />;
}
