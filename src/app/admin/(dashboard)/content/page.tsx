import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function ContentPage() {
  await requireAdmin(PERMISSIONS.contentWrite);
  const pages = await prisma.contentPage.findMany({ include: { translations: true } });
  const faqs = await prisma.fAQ.findMany({ include: { translations: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Content</h1>
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Pages</h2>
        {pages.length === 0 ? <p className="mt-2 text-sm text-[#616674]">No CMS pages yet.</p> : (
          <ul className="mt-2 text-sm">
            {pages.map((page) => (
              <li key={page.id}>{page.slug} · {page.status}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">FAQs</h2>
        {faqs.length === 0 ? <p className="mt-2 text-sm text-[#616674]">No FAQs yet. Storefront still uses the approved static FAQ copy.</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {faqs.map((faq) => (
              <li key={faq.id}>{faq.translations.find((item) => item.locale === "en")?.question}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
