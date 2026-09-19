import { CustomerDetailClient } from "@/components/admin/modules/customer-detail-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("customers.read");
  const { id } = await params;
  return <CustomerDetailClient id={id} />;
}
