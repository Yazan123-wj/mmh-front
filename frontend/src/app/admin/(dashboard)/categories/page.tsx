import { CategoriesListClient } from "@/components/admin/modules/categories-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("catalog.read");
  return <CategoriesListClient  />;
}
