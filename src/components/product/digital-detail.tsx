"use client";

import { ProductGallery } from "@/components/product/product-gallery";
import { ProductRail } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Price } from "@/components/ui/price";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { Rating } from "@/components/ui/rating";
import { StockBadge } from "@/components/ui/stock-badge";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { DIGITAL_PRODUCT_FAQS } from "@/data/faq";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useUi } from "@/context/ui-context";
import { useWishlist } from "@/context/wishlist-context";
import { getRelatedProducts } from "@/data/products";
import { discountPercent } from "@/lib/format";
import { isValidEmail, isValidDemoPhone, validateCustomerField } from "@/lib/validation";
import type { DeliveryMethod, Product } from "@/types";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { choiceClass, ICON_HIT } from "@/components/ui/control";
import { cn } from "@/lib/cn";

function deliveryLabel(method: DeliveryMethod, t: (key: string) => string) {
  if (method === "email") return t("common.emailDelivery");
  if (method === "sms") return t("common.smsDelivery");
  if (method === "account") return t("common.accountDelivery");
  return t("common.instant");
}

export function DigitalProductDetail({ product }: { product: Product }) {
  const options = product.digitalOptions;
  const isTopup = product.fulfillmentType === "direct_topup";
  const { t, locale } = useLanguage();
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const { setCartOpen } = useUi();
  const router = useRouter();
  const [regionId, setRegionId] = useState(options.regions.length === 1 ? options.regions[0].id : "");
  const [denominationId, setDenominationId] = useState(options.denominations[0]?.id ?? "");
  const [method, setMethod] = useState<DeliveryMethod>(options.deliveryMethods[0] ?? "account");
  const [contact, setContact] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [guideId, setGuideId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [refundOk, setRefundOk] = useState(false);
  const [qty, setQty] = useState(1);
  const related = getRelatedProducts(product);
  const wished = has(product.id);

  const denomination = options.denominations.find((item) => item.id === denominationId);
  const region = options.regions.find((item) => item.id === regionId);
  const sale = discountPercent(denomination?.priceJod ?? product.priceJod, denomination?.compareAtPriceJod);
  const needsContact = method === "email" || method === "sms";
  const contactOk = !needsContact || (method === "email" ? isValidEmail(contact) : isValidDemoPhone(contact));
  const fieldsOk = options.requiredCustomerFields.every((field) =>
    validateCustomerField(field.id, fields[field.id] ?? "", field.required),
  );
  const stockOk = denomination?.inStock !== false;
  const ready = Boolean(regionId && denominationId && confirmed && refundOk && contactOk && fieldsOk && stockOk);

  const price = useMemo(() => (denomination?.priceJod ?? product.priceJod) * qty, [denomination, product.priceJod, qty]);

  const buildDigital = () => {
    if (!region || !denomination) return null;
    return {
      regionId: region.id,
      regionName: locale === "ar" ? region.nameAr : region.name,
      denominationId: denomination.id,
      denominationLabel: locale === "ar" ? denomination.labelAr : denomination.label,
      deliveryMethod: method,
      deliveryContact: needsContact ? contact : "",
      platform: locale === "ar" ? options.platformLabelAr : options.platformLabel,
      customerFields: { ...fields },
    };
  };

  const add = (goCheckout = false) => {
    const digital = buildDigital();
    if (!ready || !digital) return;
    addItem({ productId: product.id, quantity: qty, digital });
    if (goCheckout) router.push("/checkout");
    else setCartOpen(true);
  };

  const warning = locale === "ar" ? options.regionWarningAr : options.regionWarning;

  return (
    <div className="container-mmh pb-28 pt-6 sm:py-8 xl:pb-8">
      <Breadcrumbs
        items={[
          { href: "/", label: "MMH" },
          { href: isTopup ? "/game-top-ups" : "/gift-cards", label: t(isTopup ? "nav.topups" : "nav.gifts") },
          { label: locale === "ar" ? product.nameAr : product.name },
        ]}
      />
      <div className="grid items-start gap-8 md:grid-cols-2 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="md:col-span-2 xl:col-span-1">
          <ProductGallery product={product} />
        </div>
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge badge="digital" label={t("common.digital")} />
            <Badge badge={isTopup ? "topup" : "instant"} label={t(isTopup ? "common.topup" : "common.instant")} />
            {options.regions.some((item) => item.locked) ? (
              <Badge badge="region_locked" label={t("common.regionLocked")} />
            ) : null}
            {sale ? <Badge badge="sale" label={`-${sale}%`} /> : null}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">
            {locale === "ar" ? options.platformLabelAr : options.platformLabel} · {product.brand}
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{locale === "ar" ? product.nameAr : product.name}</h1>
          <p className="mt-2 text-sm text-muted">{locale === "ar" ? product.shortDescriptionAr : product.shortDescription}</p>
          <div className="mt-3">
            <Rating value={product.rating} count={product.reviewCount} reviewsLabel={t("common.reviews")} />
          </div>
          {warning ? (
            <p className="mt-5 rounded-[12px] border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-amber">{warning}</p>
          ) : null}
          {options.regions.length > 1 ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">{t("product.region")}</p>
              <div className="grid grid-cols-2 gap-2">
                {options.regions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRegionId(item.id)}
                    className={choiceClass(regionId === item.id, "px-3 py-3 text-start")}
                  >
                    {locale === "ar" ? item.nameAr : item.name}
                    {item.currency ? <span className="mt-1 block text-[11px] text-muted">{item.currency}</span> : null}
                    {item.locked ? <span className="mt-1 block text-[11px] text-amber">{t("common.regionLocked")}</span> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">{isTopup ? t("product.package") : t("product.denomination")}</p>
            <div className="flex flex-wrap gap-2">
              {options.denominations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.inStock === false}
                  onClick={() => setDenominationId(item.id)}
                  className={choiceClass(denominationId === item.id, "min-h-11 px-3 py-2 text-start")}
                >
                  <span className="block text-sm">{locale === "ar" ? item.labelAr : item.label}</span>
                  <span className="block text-[11px] text-muted">
                    {item.priceJod} {t("common.jod")}
                    {item.inStock === false ? ` · ${t("common.unavailable")}` : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {options.requiredCustomerFields.map((field) => (
            <div key={field.id} className="mt-5">
              <Field
                label={locale === "ar" ? field.labelAr : field.label}
                placeholder={locale === "ar" ? field.placeholderAr : field.placeholder}
                value={fields[field.id] ?? ""}
                hint={locale === "ar" ? field.helpTextAr : field.helpText}
                error={
                  fields[field.id] && !validateCustomerField(field.id, fields[field.id], field.required)
                    ? t("product.playerIdError")
                    : undefined
                }
                onChange={(event) => setFields((current) => ({ ...current, [field.id]: event.target.value }))}
              />
              <button type="button" className="mt-1 text-xs text-gold" onClick={() => setGuideId(guideId === field.id ? null : field.id)}>
                {t("product.findId")}
              </button>
              {guideId === field.id ? (
                <p className="mt-2 rounded-[12px] border border-line bg-card p-3 text-xs leading-5 text-muted">
                  {locale === "ar" ? field.helpTextAr : field.helpText}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-[14px] border border-line bg-card p-5 md:col-span-2 xl:col-span-1">
          <Price amount={price} compareAt={denomination?.compareAtPriceJod ? denomination.compareAtPriceJod * qty : undefined} locale={locale} size="lg" />
          <div className="mt-3">
            <StockBadge
              inStock={stockOk && product.inStock}
              inLabel={t("common.inStock")}
              lowLabel={t("common.lowStock")}
              outLabel={t("common.outOfStock")}
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} max={5} />
            {options.deliveryMethods.length > 1 ? (
              <div className="flex flex-wrap rounded-[12px] border border-line p-1">
                {options.deliveryMethods.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMethod(item)}
                    className={`h-9 rounded-[8px] px-3 text-xs ${method === item ? "bg-brand text-fg" : "text-muted"}`}
                  >
                    {deliveryLabel(item, t)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {needsContact ? (
            <div className="mt-4">
              <Field
                label={t("product.deliveryContact")}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder={method === "email" ? "name@example.com" : "+962 7X XXX XXXX"}
              />
            </div>
          ) : null}
          <p className="mt-3 text-sm text-muted">{t("product.digitalNotice")}</p>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>{t("product.confirmRegion")}</span>
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1" checked={refundOk} onChange={(event) => setRefundOk(event.target.checked)} />
            <span>{t("product.confirmRefund")}</span>
          </label>
          {!ready ? (
            <p className="mt-3 text-xs text-muted">{isTopup ? t("product.disabledHint") : t("product.disabledHintCode")}</p>
          ) : null}
          <div className="mt-5 hidden gap-2 xl:flex">
            <Button className="flex-1" disabled={!ready} onClick={() => add(false)}>
              {t("product.add")}
            </Button>
            <button
              type="button"
              className={cn(ICON_HIT, "border border-line bg-elevated", wished && "text-gold")}
              onClick={() => toggle(product.id)}
              aria-label={t("common.wishlist")}
            >
              <Heart className={cn("h-4 w-4", wished && "fill-gold")} />
            </button>
          </div>
          <Button className="mt-3 hidden w-full xl:inline-flex" variant="outline" disabled={!ready} onClick={() => add(true)}>
            {t("product.buyNow")}
          </Button>
          <ul className="mt-5 space-y-2 text-xs text-muted">
            <li>{t("product.benefitsAuth")}</li>
            <li>{t("product.benefitsPrice")}</li>
            <li>{t("product.benefitsFast")}</li>
            <li>{t("product.benefitsSupport")}</li>
          </ul>
        </aside>
      </div>
      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <article className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-semibold">{t("product.howToUse")}</h2>
          <ol className="mt-3 list-decimal space-y-2 ps-5 text-sm leading-6 text-muted">
            {(locale === "ar" ? options.howToUseAr : options.howToUse).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
        <article className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-semibold">{t("product.description")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{locale === "ar" ? product.descriptionAr : product.description}</p>
        </article>
        <article className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-semibold">{t("product.regionCompat")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {locale === "ar" ? options.regionRestrictionsAr : options.regionRestrictions}
          </p>
        </article>
        <article className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-semibold">{t("product.deliveryInfo")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {locale === "ar" ? options.deliveryEstimateAr : options.deliveryEstimate}
          </p>
        </article>
        <article className="rounded-[14px] border border-line bg-card p-5 md:col-span-2">
          <h2 className="font-semibold">{t("product.refundPolicy")}</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            {locale === "ar" ? options.refundPolicyTextAr : options.refundPolicyText}
          </p>
        </article>
      </section>
      <section className="mt-14">
        <h2 className="mb-6 text-lg font-semibold">{t("product.faq")}</h2>
        <FaqAccordion items={DIGITAL_PRODUCT_FAQS} locale={locale} columns={2} />
      </section>
      <section className="mt-12">
        <h2 className="mb-6 text-lg font-semibold">{t("product.related")}</h2>
        <ProductRail products={related} />
      </section>
      <div className="fixed inset-x-0 bottom-0 z-[35] border-t border-line bg-elevated/96 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md xl:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2 sm:gap-3">
          <div className="min-w-0 shrink">
            <Price amount={price} locale={locale} />
          </div>
          <Button className="min-h-11 min-w-0 flex-1 px-3 text-sm" disabled={!ready} onClick={() => add(false)}>
            {t("product.add")}
          </Button>
          <Button className="min-h-11 shrink-0 px-3 text-sm" variant="outline" disabled={!ready} onClick={() => add(true)}>
            {t("product.buyNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
