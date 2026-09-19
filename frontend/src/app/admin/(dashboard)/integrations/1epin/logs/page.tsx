import { OneEpinLogsClient } from "@/components/admin/modules/oneepin-logs-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("suppliers.read");
  return <OneEpinLogsClient  />;
}
