import { ProductDetailClient } from "@/components/admin/product-detail-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("catalog.read");
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
