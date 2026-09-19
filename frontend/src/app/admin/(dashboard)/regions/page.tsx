import { RegionsListClient } from "@/components/admin/modules/regions-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("catalog.read");
  return <RegionsListClient  />;
}
