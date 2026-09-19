import { AdministratorsListClient } from "@/components/admin/modules/administrators-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("admins.read");
  return <AdministratorsListClient  />;
}
