import { BRANDS } from "@/data/brands";
import { PRODUCTS } from "@/data/products";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";

export const metadata = pageMeta("Brands sold by MMH", "PlayStation, Steam, Roblox, PUBG and more — sold by MMH, not owned by MMH.", "/brands");

export default function BrandsPage() {
  return (
    <div className="container-mmh py-6 sm:py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">Brands sold by MMH</h1>
      <p className="mt-2 mb-8 max-w-2xl text-sm text-muted">
        MMH is a retailer of digital gaming products. These platforms are sold here; MMH does not own them.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRANDS.map((brand) => {
          const count = PRODUCTS.filter((product) => product.brand === brand.name).length;
          return (
            <article key={brand.slug} id={brand.slug} className="rounded-[12px] border border-line bg-card p-5">
              <h2 className="text-lg font-semibold">{brand.name}</h2>
              <p className="mt-2 text-sm text-muted">{brand.description}</p>
              <Link href={`/shop?brand=${encodeURIComponent(brand.name)}`} className="mt-4 inline-flex text-sm text-accent">
                {count} products
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
