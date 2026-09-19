import { CodesListClient } from "@/components/admin/modules/codes-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("codes.read");
  return <CodesListClient  />;
}
