"use client";

import { ProductArtwork } from "@/components/product/product-artwork";
import { SectionHeading } from "@/components/ui/section-heading";
import { Price } from "@/components/ui/price";
import { getProductById } from "@/data/products";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";

const IDS = ["psn-store", "steam-wallet", "ea-fc-points", "pubg-uc", "xbox-gift", "roblox-card"];

export function InstantDigital() {
  const { t, locale } = useLanguage();
  const cards = IDS.map((id) => getProductById(id)!);

  return (
    <section className="border-y border-line bg-elevated/40 py-10 md:py-16">
      <div className="container-mmh">
        <SectionHeading
          eyebrow={t("common.instant")}
          title={t("home.instantCards")}
          subtitle={t("home.instantCardsSub")}
          actionHref="/gift-cards"
          actionLabel={t("common.viewAll")}
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="overflow-hidden rounded-[12px] border border-line bg-card transition-colors hover:border-gold/38"
            >
              <ProductArtwork product={product} className="aspect-[4/5]" />
              <div className="p-3">
                <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{locale === "ar" ? product.nameAr : product.name}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {product.digitalOptions?.regions[1]?.name} · {product.digitalOptions?.denominations[1]?.label}
                </p>
                <Price amount={product.priceJod} locale={locale} size="sm" className="mt-2" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
