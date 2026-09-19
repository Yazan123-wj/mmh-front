import { RolesListClient } from "@/components/admin/modules/roles-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("admins.read");
  return <RolesListClient  />;
}
