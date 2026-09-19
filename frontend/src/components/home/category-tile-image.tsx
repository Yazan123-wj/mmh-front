"use client";

import { CategoryArtwork } from "@/components/product/product-artwork";
import { cn } from "@/lib/cn";
import { useState } from "react";

export function CategoryTileImage({
  src,
  alt,
  artworkKey,
  className,
}: {
  src?: string;
  alt: string;
  artworkKey: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <div className={cn("relative overflow-hidden bg-[#17182B]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onError={() => setFailed(true)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#17182B]/80 via-transparent to-transparent" />
      </div>
    );
  }
  return <CategoryArtwork artworkKey={artworkKey} className={className} />;
}
