import { SITE } from "@/config/site";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";

export const metadata = pageMeta("Contact MMH", "Current MMH support availability and order help.", "/contact");

export default function ContactPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 lg:py-14">
      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Contact</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Official phone, email, and store-hour details have not yet been published. The site will not pretend to send a message while no support inbox is connected.</p>
        <dl className="mt-8 space-y-4 text-sm">
          {SITE.contact.phone ? <div><dt className="text-muted">Phone</dt><dd className="mt-1">{SITE.contact.phone}</dd></div> : null}
          {SITE.contact.email ? <div><dt className="text-muted">Email</dt><dd className="mt-1">{SITE.contact.email}</dd></div> : null}
          <div>
            <dt className="text-muted">Location</dt>
            <dd className="mt-1">{SITE.contact.city}</dd>
            {SITE.contact.address ? <dd>{SITE.contact.address}</dd> : null}
          </div>
          {SITE.contact.hours ? <div><dt className="text-muted">Hours</dt><dd className="mt-1">{SITE.contact.hours}</dd></div> : null}
        </dl>
        <p className="mt-7 text-sm text-muted">For an existing order, sign in with the customer account used to create it and keep the order number ready.</p>
        <Link href="/account/orders" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-brand-deep px-5 text-sm font-semibold text-white">View my orders</Link>
      </div>
    </div>
  );
}
