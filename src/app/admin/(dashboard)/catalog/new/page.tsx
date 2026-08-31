import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { prisma } from "@/server/db";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import Link from "next/link";

export default async function NewProductPage() {
  await requireAdmin(PERMISSIONS.catalogWrite);
  const [categories, platforms] = await Promise.all([
    prisma.category.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } }),
    prisma.platform.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin/catalog" className="text-xs text-[#0040FD]">Catalog</Link>
        <h1 className="text-2xl font-semibold">New product</h1>
      </div>
      <ProductEditorForm
        mode="create"
        categories={categories.map((item) => ({
          id: item.id,
          label: item.translations.find((row) => row.locale === "en")?.name ?? item.slug,
        }))}
        platforms={platforms.map((item) => ({
          id: item.id,
          label: item.translations.find((row) => row.locale === "en")?.name ?? item.slug,
        }))}
      />
    </div>
  );
}
