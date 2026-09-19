import { SupplierDetailClient } from "@/components/admin/modules/supplier-detail-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("suppliers.read");
  const { id } = await params;
  return <SupplierDetailClient id={id} />;
}
