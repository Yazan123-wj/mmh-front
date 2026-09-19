"use client";

import { ProductCover } from "@/components/product/product-artwork";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useUi } from "@/context/ui-context";
import { formatJod } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CartDigitalMeta, Product } from "@/types";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function defaultDigital(product: Product, locale: "en" | "ar"): CartDigitalMeta | undefined {
  const options = product.digitalOptions;
  const region = options.regions[0];
  const denomination = options.denominations[0];
  if (!region || !denomination) return undefined;
  const deliveryMethod = options.deliveryMethods[0] ?? "account";
  return {
    regionId: region.id,
    regionName: locale === "ar" ? region.nameAr : region.name,
    denominationId: denomination.id,
    denominationLabel: locale === "ar" ? denomination.labelAr : denomination.label,
    deliveryMethod,
    deliveryContact: "",
    platform: locale === "ar" ? options.platformLabelAr : options.platformLabel,
    customerFields: {},
  };
}

export function CompleteOrderBundle({
  product,
  suggestions,
}: {
  product: Product;
  suggestions: Product[];
}) {
  const { t, locale } = useLanguage();
  const { addItem } = useCart();
  const { setCartOpen } = useUi();

  const items = useMemo(() => {
    const extras = suggestions.filter((item) => item.id !== product.id && item.inStock).slice(0, 3);
    return [product, ...extras];
  }, [product, suggestions]);

  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    items.forEach((item, index) => {
      next[item.id] = index < 3;
    });
    setSelected(next);
  }, [items]);

  if (items.length < 2) return null;

  const selectedItems = items.filter((item) => selected[item.id]);
  const total = selectedItems.reduce((sum, item) => sum + item.priceJod, 0);
  const canBuy = selectedItems.length >= 1;

  const toggle = (id: string) => {
    setSelected((current) => ({ ...current, [id]: !current[id] }));
  };

  const buyTogether = () => {
    if (!canBuy) return;
    for (const item of selectedItems) {
      addItem({
        productId: item.id,
        quantity: 1,
        digital: defaultDigital(item, locale),
      });
    }
    setCartOpen(true);
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-brand-deep text-white">
      <div className="px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{t("product.completeOrder")}</h2>
        <p className="mt-1 text-sm text-white/70">{t("product.completeOrderHint")}</p>
      </div>

      <ul className="px-4 sm:px-5">
        {items.map((item, index) => {
          const checked = Boolean(selected[item.id]);
          const name = locale === "ar" ? item.nameAr : item.name;
          const isMain = item.id === product.id;
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 py-3",
                index < items.length - 1 && "border-b border-white/10",
              )}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[#F7C037]"
                  checked={checked}
                  onChange={() => toggle(item.id)}
                  aria-label={name}
                />
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#17182b]">
                  <ProductCover
                    product={item}
                    shot="cover"
                    compact
                    label={name}
                    className="aspect-square h-full w-full p-0 [&_img]:p-0.5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium leading-5 text-white hover:text-gold"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {name}
                    {isMain ? (
                      <span className="ms-1 text-xs font-normal text-white/55">({t("product.completeOrderThis")})</span>
                    ) : null}
                  </Link>
                </span>
              </label>
              <Price
                amount={item.priceJod}
                locale={locale}
                size="sm"
                className="shrink-0 [&>span:first-child]:text-white"
              />
            </li>
          );
        })}
      </ul>

      <div className="p-4 sm:p-5">
        <Button
          variant="gold"
          className="w-full"
          disabled={!canBuy}
          onClick={buyTogether}
        >
          {`${t("product.buyTogether")} ${formatJod(total, locale)}`}
        </Button>
      </div>
    </section>
  );
}
