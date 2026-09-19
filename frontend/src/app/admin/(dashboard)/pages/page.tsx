import { PagesListClient } from "@/components/admin/modules/pages-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("content.read");
  return <PagesListClient  />;
}
