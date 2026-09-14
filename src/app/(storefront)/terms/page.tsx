import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Terms", "Current MMH storefront order terms and service limitations.", "/terms");

export default function TermsPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 text-sm leading-7 text-muted md:py-14">
      <h1 className="text-2xl font-semibold text-fg sm:text-3xl">Terms</h1>
      <p className="mt-3 text-xs uppercase tracking-wide text-amber">Interim terms — requires final business and legal review before launch.</p>
      <div className="mt-6 space-y-4">
        <p>The current storefront can create a pending order record. It does not process a payment, reserve supplier inventory, submit a top-up, or issue a digital code.</p>
        <p>Prices are shown in Jordanian dinars. Availability and price are revalidated on the server when a pending order is created.</p>
        <p>Do not treat a pending order as a completed purchase. Formal terms of sale and a connected payment method are required before live trading begins.</p>
      </div>
    </div>
  );
}
