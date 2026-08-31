import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";
import { saveBannerPublish, createBanner, duplicateBanner, archiveBanner } from "@/server/actions/admin";

export default async function BannersPage() {
  await requireAdmin(PERMISSIONS.contentWrite);
  const banners = await prisma.banner.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Banners</h1>
        <p className="text-sm text-[#616674]">Published banners appear in the existing MMH homepage promo component.</p>
      </div>
      <form action={createBanner} className="grid gap-3 rounded-xl border border-[#E7EAF1] bg-white p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold">New banner</h2>
        <input name="kicker" placeholder="Kicker" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="href" placeholder="/shop" defaultValue="/shop" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="titleEn" required placeholder="Title EN" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="titleAr" required placeholder="Title AR" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="subtitleEn" placeholder="Subtitle EN" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="subtitleAr" placeholder="Subtitle AR" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="ctaEn" placeholder="CTA EN" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="ctaAr" placeholder="CTA AR" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <select name="tone" className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
          <option value="gold">Gold</option>
          <option value="blue">Blue</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" /> Publish</label>
        <label className="text-sm">Desktop image<input name="desktop" type="file" accept="image/*" className="mt-1 block text-xs" /></label>
        <label className="text-sm">Mobile image<input name="mobile" type="file" accept="image/*" className="mt-1 block text-xs" /></label>
        <button className="h-9 rounded-lg bg-[#0040FD] text-sm font-semibold text-white md:col-span-2">Create banner</button>
      </form>
      <div className="space-y-3">
        {banners.map((banner) => {
          const en = banner.translations.find((item) => item.locale === "en");
          const ar = banner.translations.find((item) => item.locale === "ar");
          return (
            <article key={banner.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7EAF1] bg-white p-4">
              <div>
                <p className="text-xs text-[#616674]">{banner.kicker} · {banner.placement} · {banner.published ? "Published" : "Hidden"}</p>
                <p className="font-medium">{en?.title}</p>
                <p className="text-sm text-[#616674]">{ar?.title}</p>
              </div>
              <div className="flex gap-2">
                <form action={async () => { "use server"; await saveBannerPublish(banner.id, !banner.published); }}>
                  <button className="h-8 rounded-lg border border-[#E7EAF1] px-3 text-xs font-semibold">
                    {banner.published ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <form action={async () => { "use server"; await duplicateBanner(banner.id); }}>
                  <button className="h-8 rounded-lg border border-[#E7EAF1] px-3 text-xs">Duplicate</button>
                </form>
                <form action={async () => { "use server"; await archiveBanner(banner.id); }}>
                  <button className="h-8 rounded-lg border border-[#E7EAF1] px-3 text-xs">Archive</button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
