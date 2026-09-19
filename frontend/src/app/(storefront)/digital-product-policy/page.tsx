import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Digital product policy",
  "Region compatibility, code handling, top-ups, and current fulfillment limitations.",
  "/digital-product-policy",
);

export default function DigitalPolicyPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 text-sm leading-7 text-muted md:py-14">
      <h1 className="text-2xl font-semibold text-fg sm:text-3xl">Digital product policy</h1>
      <p className="mt-3 text-xs uppercase tracking-wide text-amber">
        Interim content — requires final business and legal review. Not legal advice.
      </p>
      <p className="mt-6">
        MMH sells digital gaming codes, gift cards, wallet cards, subscriptions, and selected direct account top-ups.
        Products are region and platform specific. Confirm the store country and account currency before paying.
      </p>
      <p className="mt-4">
        Region compatibility: a region-locked card can only be redeemed on an account whose store country matches the
        selected region. Account-currency compatibility: some products, such as Roblox, require the gift-card currency
        to match the receiving account.
      </p>
      <p className="mt-4">
        Code handling: the customer area never exposes a code unless the order is both paid and fulfilled. The current
        storefront does not generate or reveal issuer codes because payment and live fulfillment are not connected.
      </p>
      <p className="mt-4">
        Direct top-ups: Player ID, User ID, Zone ID, and server fields must be exact. MMH cannot reverse a top-up sent
        to an incorrect account after it is submitted to a provider.
      </p>
      <p className="mt-4">
        Used or redeemed codes, wrong-region purchases after reveal, and submitted top-ups would generally require special
        handling under the final policy. Contact support with your order number once official support details are published.
      </p>
      <p className="mt-4">
        MMH products are digital. Physical shipping and Cash on Delivery do not apply. Live delivery channels will only be
        described here after they are connected and verified.
      </p>
    </div>
  );
}
