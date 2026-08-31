import { SITE } from "@/config/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("About MMH", SITE.description, "/about");

export default function AboutPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 md:py-14">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">Amman</p>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">About MMH</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted">
        <p>
          MMH is a Jordanian store for digital gaming products: gift cards, wallet cards, game currencies, subscriptions,
          and selected direct account top-ups.
        </p>
        <p>
          We sell digital products for platforms such as PlayStation, Steam, Roblox, PUBG Mobile, Xbox, Nintendo, Apple,
          and Google Play. MMH does not own those platforms and is not officially affiliated with them unless stated later.
        </p>
        <p>
          This website is Phase 1: a complete frontend. Payments, live code delivery, and provider top-ups connect in
          Phase 2.
        </p>
      </div>
    </div>
  );
}
