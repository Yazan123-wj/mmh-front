"use client";

import { ProductCover } from "@/components/product/product-artwork";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { getProductById } from "@/data/products";
import { uniqueFaceValues } from "@/lib/digital-options";
import { useLanguage } from "@/context/language-context";
import { choiceClass } from "@/components/ui/control";
import { useState } from "react";

export function FeaturedStory() {
  const product = getProductById("psn-store")!;
  const { t, locale } = useLanguage();
  const amounts = uniqueFaceValues(product.digitalOptions.denominations);
  const [denominationId, setDenominationId] = useState(amounts[0]?.id ?? "");
  const denomination = amounts.find((item) => item.id === denominationId) ?? product.digitalOptions.denominations.find((item) => item.id === denominationId);
  const highlights = [
    [t("product.platform"), locale === "ar" ? product.digitalOptions.platformLabelAr : product.digitalOptions.platformLabel],
    [t("product.region"), locale === "ar" ? product.digitalOptions.regions[0]?.nameAr : product.digitalOptions.regions[0]?.name],
    [t("common.instant"), t("common.instant")],
    [t("product.currency"), product.digitalOptions.accountCurrency ?? "USD"],
  ];

  return (
    <section className="container-mmh py-10 md:py-16">
      <div className="grid overflow-hidden rounded-[14px] border border-line bg-card lg:grid-cols-2">
        <div className="relative min-h-[220px] bg-deep sm:min-h-[360px]">
          <ProductCover product={product} className="h-full min-h-[220px] sm:min-h-[360px]" />
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-6 md:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{t("home.featured")}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{locale === "ar" ? product.nameAr : product.name}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {locale === "ar" ? product.shortDescriptionAr : product.shortDescription}
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {highlights.map(([key, value]) => (
              <div key={key} className="rounded-[10px] border border-line px-3 py-2">
                <dt className="text-[11px] uppercase tracking-wide text-muted">{key}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6">
            <Price amount={denomination?.priceJod ?? product.priceJod} compareAt={denomination?.compareAtPriceJod} locale={locale} size="lg" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {amounts.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDenominationId(item.id)}
                className={choiceClass(denominationId === item.id, "h-11")}
              >
                {locale === "ar" ? item.labelAr : item.label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="w-full sm:w-auto" href={`/product/${product.slug}`}>
              {t("common.viewOptions")}
            </Button>
            <Button className="w-full sm:w-auto" variant="outline" href={`/product/${product.slug}`}>
              {t("common.learnMore")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
