import { ContactForm } from "@/components/forms/contact-form";
import { SITE } from "@/config/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Contact MMH", "Store information and a frontend contact form.", "/contact");

export default function ContactPage() {
  return (
    <div className="container-mmh grid gap-8 py-10 lg:grid-cols-2 lg:gap-10 lg:py-14">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Contact</h1>
        <p className="mt-3 text-sm text-muted">Placeholders below are marked for editing before launch.</p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-muted">Phone</dt>
            <dd className="mt-1">{SITE.contact.phone}</dd>
            <dd className="text-xs text-muted">{SITE.contact.phoneNote}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-1">{SITE.contact.email}</dd>
            <dd className="text-xs text-muted">{SITE.contact.emailNote}</dd>
          </div>
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="mt-1">{SITE.contact.city}</dd>
            <dd>{SITE.contact.address}</dd>
          </div>
          <div>
            <dt className="text-muted">Hours</dt>
            <dd className="mt-1">{SITE.contact.hours}</dd>
          </div>
        </dl>
      </div>
      <ContactForm />
    </div>
  );
}
