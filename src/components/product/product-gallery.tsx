import { ProductCover } from "@/components/product/product-artwork";
import { cn } from "@/lib/cn";
import type { Product } from "@/types";

function preferredCatalogImage(product: Product) {
  const fromProduct = product.images.find((src) => /\.svg($|\?)/i.test(src));
  if (fromProduct) return fromProduct;
  // Prefer local identification tiles on the detail page to avoid supplier watermarks.
  return `/catalog/${product.id}.svg`;
}

export function ProductGallery({ product, className }: { product: Product; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-[#17182B]", className)}>
      <ProductCover product={product} src={preferredCatalogImage(product)} shot="hero" className="aspect-[4/5] sm:aspect-square" />
    </div>
  );
}
