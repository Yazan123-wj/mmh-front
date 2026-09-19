import { ProductCover } from "@/components/product/product-artwork";
import { cn } from "@/lib/cn";
import type { Product } from "@/types";

function preferredCatalogImage(product: Product) {
  const webp = product.images.find((src) => /\.webp($|\?)/i.test(src));
  if (webp) return webp;
  const fromProduct = product.images.find((src) => /\.(svg|png|jpe?g|avif)($|\?)/i.test(src));
  if (fromProduct) return fromProduct;
  return `/catalog/${product.id}.webp`;
}

export function ProductGallery({ product, className }: { product: Product; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[16px] border border-line bg-[#17182B]", className)}>
      <ProductCover product={product} src={preferredCatalogImage(product)} shot="hero" className="aspect-[4/5] sm:aspect-square" />
    </div>
  );
}
