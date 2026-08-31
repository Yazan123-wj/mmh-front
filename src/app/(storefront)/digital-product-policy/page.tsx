import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Digital product policy",
  "Region compatibility, code reveal, top-ups, and refund limitations. Placeholder pending legal review.",
  "/digital-product-policy",
);

export default function DigitalPolicyPage() {
  return (
    <div className="container-mmh max-w-3xl py-10 text-sm leading-7 text-muted md:py-14">
      <h1 className="text-2xl font-semibold text-fg sm:text-3xl">Digital product policy</h1>
      <p className="mt-3 text-xs uppercase tracking-wide text-amber">
        Placeholder content — requires final business and legal review. Not legal advice.
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
        Code reveal: once a code is shown in My Codes, emailed, or sent by SMS, it is treated as delivered. This demo
        never generates a live issuer code. Reveal shows a fictional masked value only.
      </p>
      <p className="mt-4">
        Direct top-ups: Player ID, User ID, Zone ID, and server fields must be exact. MMH cannot reverse a top-up sent
        to an incorrect account after it is submitted to a provider.
      </p>
      <p className="mt-4">
        Used or redeemed codes, wrong-region purchases after reveal, and submitted top-ups are not refundable under this
        placeholder policy. Contact support with your order number if a delivery fails on MMH’s side.
      </p>
      <p className="mt-4">
        Digital delivery in Phase 2 will use My Orders, email, or SMS according to the method selected at checkout. No
        physical shipping and no Cash on Delivery apply to MMH digital products.
      </p>
    </div>
  );
}
