import { ShopCatalog } from "@/components/shop/shop-catalog";
import { getProductsByCategory } from "@/data/products";
import { parseFilterParams } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Game top-ups",
  "Direct top-ups for PUBG Mobile, Free Fire, Mobile Legends, and more. Sold by MMH in Jordan.",
  "/game-top-ups",
);

export default async function GameTopUpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="container-mmh py-6 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">Game Top-Ups</h1>
      <p className="mt-2 mb-8 max-w-2xl text-sm text-muted">
        Direct account top-ups. Enter only the fields required for the selected game. Fulfillment is simulated in this demo.
      </p>
      <ShopCatalog
        initial={parseFilterParams(params)}
        source={getProductsByCategory("game-top-ups")}
        basePath="/game-top-ups"
      />
    </div>
  );
}
