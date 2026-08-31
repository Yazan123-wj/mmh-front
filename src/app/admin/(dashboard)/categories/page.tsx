import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { setCategoryStatus } from "@/server/actions/admin";
import Link from "next/link";

export default async function CategoriesPage() {
  await requireAdmin(PERMISSIONS.catalogRead);
  const rows = await prisma.category.findMany({ include: { translations: true, _count: { select: { products: true } } }, orderBy: { sortOrder: "asc" } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Categories</h1>
      <div className="overflow-hidden rounded-xl border border-[#E7EAF1] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F7FB] text-left text-xs uppercase text-[#616674]"><tr><th className="px-3 py-2">Name</th><th>Slug</th><th>Products</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#E7EAF1]">
                <td className="px-3 py-2">{row.translations.find((item) => item.locale === "en")?.name}</td>
                <td>{row.slug}</td>
                <td><Link href={`/admin/catalog?q=${row.slug}`} className="text-[#0040FD]">{row._count.products}</Link></td>
                <td>{row.status}</td>
                <td className="px-3 py-2">
                  <form action={async () => { "use server"; await setCategoryStatus(row.id, row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"); }}>
                    <button className="text-xs text-[#0040FD]">{row.status === "PUBLISHED" ? "Hide" : "Publish"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
