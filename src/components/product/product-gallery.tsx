import { ProductCover } from "@/components/product/product-artwork";
import { cn } from "@/lib/cn";
import type { Product } from "@/types";

export function ProductGallery({ product, className }: { product: Product; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[14px] border border-line", className)}>
      <ProductCover product={product} shot="hero" className="min-h-[240px] sm:min-h-[360px] xl:min-h-[480px]" />
    </div>
  );
}
