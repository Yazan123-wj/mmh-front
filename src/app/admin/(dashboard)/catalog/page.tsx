import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { filsToJod, marginBps } from "@/server/money";
import Link from "next/link";

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin(PERMISSIONS.catalogRead);
  const { q, status } = await searchParams;
  const products = await prisma.product.findMany({
    where: {
      status: status === "PUBLISHED" || status === "DRAFT" || status === "ARCHIVED" ? status : undefined,
      OR: q
        ? [
            { slug: { contains: q, mode: "insensitive" } },
            { translations: { some: { name: { contains: q, mode: "insensitive" } } } },
          ]
        : undefined,
    },
    include: {
      translations: true,
      platform: { include: { translations: true } },
      category: { include: { translations: true } },
      variants: true,
      supplier: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Catalog</h1>
          <p className="text-sm text-[#616674]">{products.length} products</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/catalog/new" className="inline-flex h-9 items-center rounded-lg bg-[#0040FD] px-3 text-sm font-semibold text-white">
            New product
          </Link>
          <a href="/api/admin/catalog/export" className="inline-flex h-9 items-center rounded-lg border border-[#E7EAF1] px-3 text-sm">
            Export CSV
          </a>
        </div>
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search catalog" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-[#E7EAF1] bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[#E7EAF1] bg-[#F5F7FB] text-left text-xs uppercase tracking-wide text-[#616674]">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Platform</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Margin</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const start = product.variants[0];
              const margin = start ? marginBps(start.priceFils, start.costFils) / 100 : 0;
              return (
                <tr key={product.id} className="border-b border-[#E7EAF1] last:border-0">
                  <td className="px-3 py-2">
                    <Link href={`/admin/catalog/${product.id}`} className="font-medium text-[#0040FD]">
                      {product.translations.find((item) => item.locale === "en")?.name ?? product.id}
                    </Link>
                    <p className="text-xs text-[#616674]">{product.slug}</p>
                  </td>
                  <td className="px-3 py-2">{product.platform.translations.find((item) => item.locale === "en")?.name}</td>
                  <td className="px-3 py-2">{product.category.translations.find((item) => item.locale === "en")?.name}</td>
                  <td className="px-3 py-2">{product.fulfillmentType}</td>
                  <td className="px-3 py-2">{start ? `JOD ${filsToJod(start.priceFils).toFixed(3)}` : "—"}</td>
                  <td className="px-3 py-2">{margin.toFixed(1)}%</td>
                  <td className="px-3 py-2">{product.status}</td>
                  <td className="px-3 py-2">{product.supplier?.name ?? "Manual"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
