import { FaqsListClient } from "@/components/admin/modules/faqs-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("content.read");
  return <FaqsListClient  />;
}
