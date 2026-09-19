import { CodeImportsListClient } from "@/components/admin/modules/code-imports-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("codes.manage");
  return <CodeImportsListClient />;
}
