import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod } from "@/server/money";

export default async function ReportsPage() {
  await requireAdmin(PERMISSIONS.reportsRead);
  const byPlatform = await prisma.product.groupBy({ by: ["platformId"], _count: true });
  const paid = await prisma.order.aggregate({ _sum: { totalFils: true }, where: { paymentStatus: "PAID" } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Reports</h1>
      <p className="text-sm text-[#616674]">Paid revenue JOD {filsToJod(paid._sum.totalFils ?? 0).toFixed(3)}</p>
      <p className="mt-2 text-sm">{byPlatform.length} platforms with catalog products</p>
    </div>
  );
}
