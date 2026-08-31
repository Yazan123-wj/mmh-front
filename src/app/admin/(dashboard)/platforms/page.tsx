import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function PlatformsPage() {
  await requireAdmin(PERMISSIONS.catalogRead);
  const rows = await prisma.platform.findMany({ include: { translations: true, _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Platforms</h1>
      <ul className="grid gap-3 md:grid-cols-3">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border border-[#E7EAF1] bg-white p-4">
            <p className="font-medium">{row.translations.find((item) => item.locale === "en")?.name}</p>
            <p className="text-sm text-[#616674]">{row._count.products} products · {row.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
