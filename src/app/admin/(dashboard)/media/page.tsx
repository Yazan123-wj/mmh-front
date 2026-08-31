import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function MediaPage() {
  await requireAdmin(PERMISSIONS.mediaWrite);
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Media</h1>
      {assets.length === 0 ? <p className="text-sm text-[#616674]">No uploaded assets yet. Local development files are stored outside PostgreSQL.</p> : (
        <ul className="grid gap-3 md:grid-cols-4">
          {assets.map((asset) => (
            <li key={asset.id} className="rounded-xl border border-[#E7EAF1] bg-white p-3 text-xs">
              {asset.filename}<p className="text-[#616674]">{asset.mimeType}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
