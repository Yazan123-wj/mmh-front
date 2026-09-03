import { ShopCatalog } from "@/components/shop/shop-catalog";
import { PRODUCTS } from "@/data/products";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Gift cards",
  "PlayStation Store, Steam, Xbox, Nintendo, Google Play, and Apple gift cards in JOD.",
  "/gift-cards",
);

export default async function GiftCardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="container-mmh py-6 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">Gift Cards</h1>
      <p className="mt-2 mb-8 max-w-2xl text-sm text-muted">
        Buy a card, enter the receiver’s mobile number, pay, then the PIN is sent to that phone. They redeem it in the official store. Codes in this demo are fictional.
      </p>
      <ShopCatalog
        initial={parseFilterParams(params)}
        source={PRODUCTS.filter((product) => product.digitalOptions.kind === "gift_card" || product.digitalOptions.kind === "wallet")}
        basePath="/gift-cards"
      />
    </div>
  );
}
