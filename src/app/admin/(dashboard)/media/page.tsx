import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function MediaPage() {
  await requireAdmin(PERMISSIONS.mediaWrite);
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Media</h1>
      {assets.length === 0 ? (
        <p className="text-sm text-[#616674]">No uploaded assets yet. Local development files are stored outside PostgreSQL.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-4">
          {assets.map((asset) => (
            <li key={asset.id} className="rounded-xl border border-[#E7EAF1] bg-white p-3 text-xs">
              <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-[#F5F7FB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.filename} className="max-h-full max-w-full object-contain p-2" />
              </div>
              <p className="font-medium">{asset.filename}</p>
              <p className="text-[#616674]">{asset.mimeType}</p>
              {asset.mappedProductId ? <p className="mt-1 text-[#616674]">Product: {asset.mappedProductId}</p> : null}
              {asset.artworkKind ? <p className="text-[#616674]">{asset.artworkKind}</p> : null}
              {asset.sourcePageUrl ? (
                <p className="mt-1 break-all text-[#616674]">
                  Source: {asset.sourcePageUrl}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
