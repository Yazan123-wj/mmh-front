"use client";

import { ProductArtwork } from "@/components/product/product-artwork";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/context/toast-context";
import { useWishlist } from "@/context/wishlist-context";
import { getProductById } from "@/data/products";
import { cartHasRegionLocked, linePrice, maskAccountValue } from "@/lib/cart";
import Link from "next/link";
import { useState } from "react";

export function CartPageView() {
  const { items, updateQty, removeItem, updateItemDigital, subtotal, discount, applyPromo, promoError, promoCode, hydrated } = useCart();
  const { toggle } = useWishlist();
  const { t, locale } = useLanguage();
  const { push } = useToast();
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  if (!hydrated) return <div className="container-mmh py-16 text-muted">{t("common.loading")}</div>;
  if (items.length === 0) {
    return (
      <div className="container-mmh py-16">
        <EmptyState title={t("cart.empty")} actionHref="/shop" actionLabel={t("cart.emptyCta")} />
      </div>
    );
  }

  const regionLocked = cartHasRegionLocked(items);

  return (
    <div className="container-mmh grid gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10 lg:py-10">
      <div className="space-y-6 sm:space-y-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t("cart.title")}</h1>
        {regionLocked ? (
          <p className="rounded-[12px] border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">{t("cart.regionWarning")}</p>
        ) : null}
        <section>
          {items.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            const player = item.digital?.customerFields?.playerId || item.digital?.customerFields?.userId;
            return (
              <div key={item.lineId} className="mb-3 rounded-[12px] border border-line bg-card p-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[10px] sm:h-24 sm:w-24">
                    <ProductArtwork product={product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <Link href={`/product/${product.slug}`} className="font-medium leading-5">
                        {locale === "ar" ? product.nameAr : product.name}
                      </Link>
                      <span className="shrink-0">
                        <Price amount={linePrice(item, product)} locale={locale} />
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {item.digital?.platform} · {item.digital?.regionName} · {item.digital?.denominationLabel}
                    </p>
                    <p className="text-xs text-muted">
                      {product.fulfillmentType === "direct_topup"
                        ? t("common.topup")
                        : item.digital?.giftIntent === "recipient"
                          ? t("gift.send")
                          : item.digital?.giftIntent === "self"
                            ? t("gift.forMe")
                            : t("common.instant")}
                      {item.digital?.giftIntent === "recipient" && item.digital.recipientEmail
                        ? ` · ${item.digital.recipientEmail}`
                        : item.digital?.deliveryContact
                          ? ` · ${item.digital.deliveryContact}`
                          : ""}
                      {player ? ` · ${maskAccountValue(player)}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <QuantitySelector value={item.quantity} onChange={(value) => updateQty(item.lineId, value)} />
                      <button type="button" className="text-xs text-gold" onClick={() => setEditing(editing === item.lineId ? null : item.lineId)}>
                        {t("common.edit")}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted"
                        onClick={() => {
                          toggle(product.id);
                          removeItem(item.lineId);
                        }}
                      >
                        {t("cart.moveWishlist")}
                      </button>
                      <button type="button" className="text-xs text-danger" onClick={() => removeItem(item.lineId)}>
                        {t("common.remove")}
                      </button>
                    </div>
                    {editing === item.lineId && item.digital ? (
                      <div className="mt-3 space-y-3 rounded-[10px] border border-line bg-card p-3">
                        {product.digitalOptions.requiredCustomerFields.map((field) => (
                          <Field
                            key={field.id}
                            label={locale === "ar" ? field.labelAr : field.label}
                            value={item.digital?.customerFields?.[field.id] ?? ""}
                            onChange={(event) =>
                              updateItemDigital(item.lineId, {
                                ...item.digital!,
                                customerFields: { ...item.digital?.customerFields, [field.id]: event.target.value },
                              })
                            }
                          />
                        ))}
                        <Button href={`/product/${product.slug}`} variant="secondary">
                          {t("common.viewOptions")}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-sm text-muted">{t("cart.digitalNote")}</p>
        </section>
      </div>
      <aside className="h-fit rounded-[14px] border border-line bg-elevated p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">{t("cart.summary")}</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t("cart.subtotal")}</dt><dd><Price amount={subtotal} locale={locale} size="sm" /></dd></div>
          {discount > 0 ? <div className="flex justify-between text-success"><dt>{t("cart.discount")}</dt><dd>- {discount}</dd></div> : null}
          <div className="flex justify-between border-t border-line pt-3 font-semibold"><dt>{t("cart.total")}</dt><dd><Price amount={subtotal - discount} locale={locale} /></dd></div>
        </dl>
        <div className="mt-4 flex gap-2">
          <Field label={t("cart.promo")} value={code} onChange={(event) => setCode(event.target.value)} />
        </div>
        <Button
          variant="secondary"
          className="mt-2 w-full"
          onClick={() => {
            const ok = applyPromo(code);
            push({ title: ok ? t("cart.promoOk") : t("cart.promoBad"), tone: ok ? "success" : "error" });
          }}
        >
          {t("cart.promoApply")}
        </Button>
        {promoCode ? <p className="mt-2 text-xs text-success">{promoCode}</p> : null}
        {promoError ? <p className="mt-2 text-xs text-danger">{t("cart.promoBad")}</p> : null}
        <Button className="mt-5 w-full" href="/checkout">
          {t("cart.checkout")}
        </Button>
      </aside>
    </div>
  );
}
