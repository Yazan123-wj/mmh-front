import { ProductNewClient } from "@/components/admin/product-new-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("catalog.write");
  return <ProductNewClient  />;
}
