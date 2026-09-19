import { ProductsListClient } from "@/components/admin/products-list-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("catalog.read");
  return <ProductsListClient  />;
}
