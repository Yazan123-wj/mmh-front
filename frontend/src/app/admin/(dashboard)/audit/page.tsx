import { AuditListClient } from "@/components/admin/modules/audit-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("audit.read");
  return <AuditListClient  />;
}
