import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Terms", "Frontend terms placeholder for MMH.", "/terms");

export default function TermsPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 text-sm leading-7 text-muted md:py-14">
      <h1 className="text-2xl font-semibold text-fg sm:text-3xl">Terms</h1>
      <p className="mt-6">
        This website is a frontend demonstration. Orders placed here are simulations and do not create a binding purchase
        or process a real payment. Formal terms of sale will be published before live checkout.
      </p>
    </div>
  );
}
