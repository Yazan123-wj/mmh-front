import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  await requireAdmin(PERMISSIONS.auditRead);
  const { action } = await searchParams;
  const rows = await prisma.auditLog.findMany({
    where: action ? { action: { contains: action, mode: "insensitive" } } : undefined,
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { actor: true },
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Audit log</h1>
      <form className="mb-4">
        <input name="action" defaultValue={action} placeholder="Filter by action" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
      </form>
      <div className="overflow-x-auto rounded-xl border border-[#E7EAF1] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F5F7FB] text-left text-xs uppercase text-[#616674]"><tr><th className="px-3 py-2">Time</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#E7EAF1]">
                <td className="px-3 py-2">{row.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
                <td>{row.actor?.email ?? "system"}</td>
                <td>{row.action}</td>
                <td>{row.entityType} {row.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
