import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function IntegrationLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; result?: string; ok?: string; q?: string; from?: string; to?: string }>;
}) {
  await requireAdmin(PERMISSIONS.catalogRead);
  const { action, result, ok, q, from, to } = await searchParams;
  const logs = await prisma.supplierApiLog.findMany({
    where: {
      action: action || undefined,
      resultCode: result || undefined,
      ok: ok === "true" ? true : ok === "false" ? false : undefined,
      createdAt:
        from || to
          ? {
              gte: from ? new Date(from) : undefined,
              lte: to ? new Date(`${to}T23:59:59.999Z`) : undefined,
            }
          : undefined,
      OR: q
        ? [{ correlationId: { contains: q } }, { relatedOrderId: q }, { message: { contains: q, mode: "insensitive" } }]
        : undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-4">
      <Link href="/admin/integrations/1epin" className="text-xs text-[#0040FD]">Integrations</Link>
      <h1 className="text-2xl font-semibold">1Epin logs</h1>
      <form className="flex flex-wrap gap-2">
        <input name="action" defaultValue={action} placeholder="Endpoint" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="result" defaultValue={result} placeholder="Result code" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="from" type="date" defaultValue={from} className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="to" type="date" defaultValue={to} className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <select name="ok" defaultValue={ok ?? ""} className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
          <option value="">All</option>
          <option value="true">Success</option>
          <option value="false">Failure</option>
        </select>
        <input name="q" defaultValue={q} placeholder="Correlation / order" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-[#E7EAF1] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#F5F7FB] text-left text-xs uppercase text-[#616674]">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th>Endpoint</th>
              <th>Code</th>
              <th>HTTP</th>
              <th>ms</th>
              <th>Correlation</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-[#E7EAF1]">
                <td className="px-3 py-2">{log.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
                <td>{log.action}</td>
                <td>{log.resultCode ?? "—"}</td>
                <td>{log.statusCode ?? "—"}</td>
                <td>{log.durationMs ?? "—"}</td>
                <td className="font-mono text-xs">{log.correlationId ?? "—"}</td>
                <td>{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
