import { PlatformsListClient } from "@/components/admin/modules/platforms-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("catalog.read");
  return <PlatformsListClient  />;
}
