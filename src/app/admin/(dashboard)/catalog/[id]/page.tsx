import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { setProductStatus, addProductVariant, updateVariantPrice, uploadProductArtwork, duplicateProduct } from "@/server/actions/admin";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import { filsToJod, marginBps } from "@/server/money";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ProductEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin(PERMISSIONS.catalogWrite);
  const { id } = await params;
  const [product, categories, platforms] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        variants: { include: { translations: true }, orderBy: { sortOrder: "asc" } },
        fields: { include: { options: true } },
        media: true,
        category: true,
        platform: true,
      },
    }),
    prisma.category.findMany({ include: { translations: true } }),
    prisma.platform.findMany({ include: { translations: true } }),
  ]);
  if (!product) notFound();
  const en = product.translations.find((item) => item.locale === "en");
  const ar = product.translations.find((item) => item.locale === "ar") ?? en;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/catalog" className="text-xs text-[#0040FD]">Catalog</Link>
          <h1 className="text-2xl font-semibold">{en?.name ?? product.id}</h1>
          <p className="text-sm text-[#616674]">{product.status} · {product.fulfillmentType}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/product/${product.slug}`} className="inline-flex h-8 items-center rounded-lg border border-[#E7EAF1] px-3 text-xs" target="_blank">Preview storefront</Link>
          <form action={async () => { "use server"; await duplicateProduct(id); }}>
            <button className="h-8 rounded-lg border border-[#E7EAF1] px-3 text-xs">Duplicate</button>
          </form>
          <form action={async () => { "use server"; await setProductStatus(id, "PUBLISHED"); }}>
            <button className="h-8 rounded-lg bg-[#0040FD] px-3 text-xs font-semibold text-white">Publish</button>
          </form>
          <form action={async () => { "use server"; await setProductStatus(id, "DRAFT"); }}>
            <button className="h-8 rounded-lg border border-[#E7EAF1] px-3 text-xs">Unpublish</button>
          </form>
          <form action={async () => { "use server"; await setProductStatus(id, "ARCHIVED"); }}>
            <button className="h-8 rounded-lg border border-[#E7EAF1] px-3 text-xs">Archive</button>
          </form>
        </div>
      </div>

      <ProductEditorForm
        mode="edit"
        categories={categories.map((item) => ({ id: item.id, label: item.translations.find((row) => row.locale === "en")?.name ?? item.slug }))}
        platforms={platforms.map((item) => ({ id: item.id, label: item.translations.find((row) => row.locale === "en")?.name ?? item.slug }))}
        product={{
          id: product.id,
          slug: product.slug,
          brand: product.brand,
          artworkKey: product.artworkKey,
          kind: product.kind,
          fulfillmentType: product.fulfillmentType,
          categoryId: product.categoryId,
          platformId: product.platformId,
          featured: product.featured,
          bestseller: product.bestseller,
          refundable: product.refundable,
          seoTitle: product.seoTitle,
          seoDescription: product.seoDescription,
          nameEn: en?.name ?? "",
          nameAr: ar?.name ?? "",
          shortEn: en?.shortDescription ?? "",
          shortAr: ar?.shortDescription ?? "",
          descriptionEn: en?.description ?? "",
          descriptionAr: ar?.description ?? "",
          instructionsEn: en?.instructions ?? "",
          instructionsAr: ar?.instructions ?? "",
        }}
      />

      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Artwork and media</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {product.media.map((item) => (
            <div key={item.id} className="h-24 w-24 overflow-hidden rounded-lg border border-[#E7EAF1] bg-[#F5F7FB]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-contain p-1" />
            </div>
          ))}
        </div>
        <form className="mt-3 flex flex-wrap items-end gap-2" action={async (formData) => { "use server"; await uploadProductArtwork(id, formData); }}>
          <label className="text-sm">
            Upload artwork
            <input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/avif" required className="mt-1 block text-xs" />
          </label>
          <button className="h-8 rounded-lg bg-[#0040FD] px-3 text-xs font-semibold text-white">Upload</button>
        </form>
      </section>

      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Variants</h2>
        <table className="mt-2 w-full text-sm">
          <thead className="text-left text-xs text-[#616674]">
            <tr>
              <th className="py-2">SKU</th>
              <th>Name</th>
              <th>Price</th>
              <th>Cost</th>
              <th>Margin</th>
              <th>Lock</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {product.variants.map((variant) => (
              <tr key={variant.id} className="border-t border-[#E7EAF1]">
                <td className="py-2">{variant.sku}</td>
                <td>{variant.translations.find((item) => item.locale === "en")?.name}</td>
                <td>JOD {filsToJod(variant.priceFils).toFixed(3)}</td>
                <td>JOD {filsToJod(variant.costFils).toFixed(3)}</td>
                <td>{(marginBps(variant.priceFils, variant.costFils) / 100).toFixed(1)}%</td>
                <td>{variant.manualPriceOverride ? "Manual" : "Auto"}</td>
                <td>{variant.stockStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <form className="mt-4 grid gap-2 md:grid-cols-6" action={addProductVariant}>
          <input type="hidden" name="productId" value={id} />
          <input name="name" placeholder="Name EN" required className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm" />
          <input name="nameAr" placeholder="Name AR" className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm" />
          <input name="sku" placeholder="SKU" required className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm" />
          <input name="priceJod" type="number" step="0.001" placeholder="Price JOD" required className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm" />
          <input name="costJod" type="number" step="0.001" placeholder="Cost JOD" className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm" />
          <button className="h-9 rounded-lg bg-[#0040FD] text-xs font-semibold text-white">Add variant</button>
        </form>
        <form className="mt-3 grid gap-2 md:grid-cols-5" action={updateVariantPrice}>
          <input type="hidden" name="productId" value={id} />
          <select name="variantId" className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>{variant.sku}</option>
            ))}
          </select>
          <input name="priceJod" type="number" step="0.001" placeholder="New price JOD" required className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm" />
          <input name="costJod" type="number" step="0.001" placeholder="Cost JOD" className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm" />
          <button className="h-9 rounded-lg border border-[#E7EAF1] text-xs">Lock price</button>
        </form>
      </section>

      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Required customer fields</h2>
        <ul className="mt-2 text-sm">
          {product.fields.length === 0 ? <li className="text-[#616674]">No player fields for this product.</li> : product.fields.map((field) => (
            <li key={field.id}>{field.key} · {field.labelEn} / {field.labelAr} {field.required ? "(required)" : ""}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
