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
import { SelectField } from "@/components/ui/select-field";
import { StockBadge } from "@/components/ui/stock-badge";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { DIGITAL_PRODUCT_FAQS } from "@/data/faq";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useUi } from "@/context/ui-context";
import { useWishlist } from "@/context/wishlist-context";
import { getRelatedProducts } from "@/data/products";
import { discountPercent, formatJod } from "@/lib/format";
import { defaultRegionId, denominationsForRegion, isGiftCardProduct, matchDenominationId } from "@/lib/digital-options";
import { isValidEmail, isValidDemoPhone, validateCustomerField } from "@/lib/validation";
import type { DeliveryMethod, GiftIntent, Product } from "@/types";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { choiceClass, FOCUS_RING, ICON_HIT } from "@/components/ui/control";
import { cn } from "@/lib/cn";

function deliveryLabel(method: DeliveryMethod, t: (key: string) => string) {
  if (method === "email") return t("common.emailDelivery");
  if (method === "sms") return t("common.smsDelivery");
  if (method === "account") return t("common.accountDelivery");
  return t("common.instant");
}

type InfoTab = "how" | "details" | "region" | "delivery" | "refund";

export function DigitalProductDetail({ product }: { product: Product }) {
  const options = product.digitalOptions;
  const isTopup = product.fulfillmentType === "direct_topup";
  const isGift = isGiftCardProduct(product);
  const multiRegion = options.regions.length > 1;
  const regionLocked = options.regions.some((item) => item.locked);
  const { t, locale } = useLanguage();
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const { setCartOpen } = useUi();
  const router = useRouter();

  const initialRegion = defaultRegionId(options.regions);
  const [regionId, setRegionId] = useState(initialRegion);
  const [denominationId, setDenominationId] = useState(
    () => denominationsForRegion(product, initialRegion).find((item) => item.inStock !== false)?.id ?? "",
  );
  const [recipientPhone, setRecipientPhone] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [method, setMethod] = useState<DeliveryMethod>("account");
  const [showDelivery, setShowDelivery] = useState(false);
  const [contact, setContact] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [guideId, setGuideId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [qty, setQty] = useState(1);
  const [infoTab, setInfoTab] = useState<InfoTab>("how");
  const related = getRelatedProducts(product);
  const wished = has(product.id);

  const visibleDenoms = useMemo(() => denominationsForRegion(product, regionId), [product, regionId]);
  const denomination = options.denominations.find((item) => item.id === denominationId);
  const region = options.regions.find((item) => item.id === regionId);
  const sale = discountPercent(denomination?.priceJod ?? product.priceJod, denomination?.compareAtPriceJod);
  const sendingGift = isGift;
  const deliveryMethod: DeliveryMethod = sendingGift ? "sms" : method;
  const deliveryContact = sendingGift ? recipientPhone.trim() : contact;
  const needsContact = deliveryMethod === "email" || deliveryMethod === "sms";
  const contactOk = sendingGift
    ? isValidDemoPhone(recipientPhone)
    : !needsContact || (deliveryMethod === "email" ? isValidEmail(contact) : isValidDemoPhone(contact));
  const fieldsOk = options.requiredCustomerFields.every((field) =>
    validateCustomerField(field.id, fields[field.id] ?? "", field.required),
  );
  const stockOk = denomination?.inStock !== false;
  const ready = Boolean(regionId && denominationId && confirmed && contactOk && fieldsOk && stockOk);

  const price = useMemo(() => (denomination?.priceJod ?? product.priceJod) * qty, [denomination, product.priceJod, qty]);
  const platformName = locale === "ar" ? options.platformLabelAr : options.platformLabel;
  const showBrand = product.brand.trim().toLowerCase() !== platformName.trim().toLowerCase();
  const regionName = region ? (locale === "ar" ? region.nameAr : region.name) : null;
  const denomLabel = denomination ? (locale === "ar" ? denomination.labelAr : denomination.label) : null;

  const nextStep = !regionId
    ? t("product.needRegion")
    : !denominationId
      ? t("product.needAmount")
      : !fieldsOk
        ? t("product.needAccount")
        : sendingGift && !contactOk
          ? t("gift.needRecipient")
          : needsContact && !contactOk
            ? t("product.needContact")
            : !confirmed
            ? t("product.needConfirm")
            : !stockOk
              ? t("product.stockOut")
              : null;

  const selectRegion = (id: string) => {
    setRegionId(id);
    setDenominationId(matchDenominationId(product, id, denominationId));
  };

  const buildDigital = () => {
    if (!region || !denomination) return null;
    return {
      regionId: region.id,
      regionName: locale === "ar" ? region.nameAr : region.name,
      denominationId: denomination.id,
      denominationLabel: locale === "ar" ? denomination.labelAr : denomination.label,
      deliveryMethod,
      deliveryContact: needsContact ? deliveryContact : "",
      platform: platformName,
      customerFields: { ...fields },
      giftIntent: isGift ? ("recipient" as GiftIntent) : undefined,
      recipientPhone: sendingGift ? recipientPhone.trim() : undefined,
      giftMessage: sendingGift ? giftMessage.trim() : undefined,
    };
  };

  const add = (goCheckout = false) => {
    const digital = buildDigital();
    if (!ready || !digital) return;
    addItem({ productId: product.id, quantity: qty, digital });
    if (goCheckout) router.push("/checkout");
    else setCartOpen(true);
  };

  const tabs: Array<{ id: InfoTab; label: string }> = [
    { id: "how", label: t("product.tabHow") },
    { id: "details", label: t("product.tabDetails") },
    { id: "region", label: t("product.tabRegion") },
    { id: "delivery", label: t("product.tabDelivery") },
    { id: "refund", label: t("product.tabRefund") },
  ];

  return (
    <div className="container-mmh pb-28 pt-6 sm:py-8 xl:pb-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "MMH" },
          { href: isTopup ? "/game-top-ups" : "/gift-cards", label: t(isTopup ? "nav.topups" : "nav.gifts") },
          { label: locale === "ar" ? product.nameAr : product.name },
        ]}
      />

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <div className="lg:sticky lg:top-24">
          <ProductGallery product={product} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              badge={isTopup ? "topup" : isGift ? "digital" : "digital"}
              label={isTopup ? t("common.topup") : isGift ? t("gift.badge") : t("product.fulfillmentCode")}
            />
            {regionLocked ? <Badge badge="region_locked" label={t("common.regionLocked")} /> : null}
            {sale ? <Badge badge="sale" label={`-${sale}%`} /> : null}
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {showBrand ? `${platformName} · ${product.brand}` : platformName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {locale === "ar" ? product.nameAr : product.name}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            {locale === "ar" ? product.shortDescriptionAr : product.shortDescription}
          </p>
          {product.reviewCount > 0 ? (
            <div className="mt-3">
              <Rating value={product.rating} count={product.reviewCount} reviewsLabel={t("common.reviews")} />
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-y border-line py-5">
            <div>
              <Price
                amount={price}
                compareAt={denomination?.compareAtPriceJod ? denomination.compareAtPriceJod * qty : undefined}
                locale={locale}
                size="lg"
              />
              <div className="mt-2">
                <StockBadge
                  inStock={stockOk && product.inStock}
                  inLabel={t("common.inStock")}
                  lowLabel={t("common.lowStock")}
                  outLabel={t("common.outOfStock")}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">{t("product.qty")}</span>
              <QuantitySelector value={qty} onChange={setQty} max={5} />
            </div>
          </div>

          {multiRegion ? (
            <div className="mt-6">
              <SelectField label={t("product.stepRegion")} value={regionId} onChange={(event) => selectRegion(event.target.value)}>
                {options.regions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {locale === "ar" ? item.nameAr : item.name}
                    {item.currency ? ` (${item.currency})` : ""}
                  </option>
                ))}
              </SelectField>
              {regionLocked ? <p className="mt-2 text-xs leading-5 text-muted">{t("product.lockedHint")}</p> : null}
            </div>
          ) : null}

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium">{isTopup ? t("product.package") : t("product.stepAmount")}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {visibleDenoms.map((item) => {
                const selected = denominationId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.inStock === false}
                    aria-pressed={selected}
                    onClick={() => setDenominationId(item.id)}
                    className={choiceClass(selected, "flex min-h-[4.75rem] flex-col justify-center px-3 py-3 text-start disabled:opacity-40")}
                  >
                    <span className="text-base font-semibold">{locale === "ar" ? item.labelAr : item.label}</span>
                    <span className="mt-1 text-xs text-muted">
                      {formatJod(item.priceJod, locale)}
                      {item.inStock === false ? ` · ${t("common.unavailable")}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {isGift ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">{t("gift.who")}</p>
              <p className="mb-3 text-xs leading-5 text-muted">{t("gift.process")}</p>
              <Field
                label={t("gift.recipientPhone")}
                type="tel"
                inputMode="tel"
                value={recipientPhone}
                onChange={(event) => setRecipientPhone(event.target.value)}
                hint={t("gift.recipientPhoneHint")}
                placeholder="+962 7X XXX XXXX"
                error={recipientPhone && !isValidDemoPhone(recipientPhone) ? t("checkout.invalidPhone") : undefined}
              />
              <label className="mt-3 block space-y-1.5">
                <span className="text-sm font-medium">{t("gift.message")}</span>
                <textarea
                  value={giftMessage}
                  onChange={(event) => setGiftMessage(event.target.value)}
                  placeholder={t("gift.messagePlaceholder")}
                  rows={3}
                  className="w-full rounded-[12px] border border-line bg-elevated px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : null}

          {options.requiredCustomerFields.map((field) => (
            <div key={field.id} className="mt-6">
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

          {isGift ? (
            <div className="mt-6 rounded-[12px] border border-line bg-card/50 p-4">
              <p className="text-sm font-medium">{t("gift.redeemTitle")}</p>
              <ol className="mt-2 list-decimal space-y-1 ps-5 text-xs leading-5 text-muted">
                {(locale === "ar" ? options.howToUseAr : options.howToUse).slice(0, 4).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {!sendingGift && options.deliveryMethods.length > 1 ? (
            <div className="mt-5">
              <button
                type="button"
                className="text-xs font-medium text-gold"
                onClick={() => setShowDelivery((open) => !open)}
                aria-expanded={showDelivery}
              >
                {t("product.deliveryAdvanced")}
                {!showDelivery && method !== "account" ? ` · ${deliveryLabel(method, t)}` : ""}
              </button>
              {showDelivery ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {options.deliveryMethods.map((item) => {
                    const selected = method === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setMethod(item)}
                        className={choiceClass(selected, "px-3 py-2")}
                      >
                        {deliveryLabel(item, t)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {needsContact ? (
                <div className="mt-3">
                  <Field
                    label={t("product.deliveryContact")}
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder={method === "email" ? "name@example.com" : "+962 7X XXX XXXX"}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-5 text-muted">
            <input
              type="checkbox"
              className={cn("mt-0.5 h-4 w-4 shrink-0 accent-[#F7C037]", FOCUS_RING)}
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>{t("product.confirmCombined")}</span>
          </label>

          <div className="mt-5 hidden gap-2 lg:flex">
            <Button className="min-h-12 flex-1" disabled={!ready} aria-describedby={nextStep ? "product-buy-hint" : undefined} onClick={() => add(false)}>
              {t("product.add")}
            </Button>
            <button
              type="button"
              className={cn(ICON_HIT, "border border-line bg-card", wished && "text-gold")}
              onClick={() => toggle(product.id)}
              aria-label={t("common.wishlist")}
            >
              <Heart className={cn("h-4 w-4", wished && "fill-gold")} />
            </button>
          </div>
          <Button className="mt-2 hidden min-h-12 w-full lg:inline-flex" variant="outline" disabled={!ready} onClick={() => add(true)}>
            {t("product.buyNow")}
          </Button>
          {nextStep ? (
            <p id="product-buy-hint" className="mt-3 hidden text-xs text-muted lg:block">
              {nextStep}
            </p>
          ) : (
            <p className="mt-3 hidden text-xs text-success lg:block">{t("product.digitalNotice")}</p>
          )}
        </div>
      </div>

      <section className="mt-14">
        <div className="flex flex-wrap gap-2 border-b border-line pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setInfoTab(tab.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                infoTab === tab.id ? "bg-gold/15 text-gold" : "text-muted hover:text-fg",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-5 max-w-3xl text-sm leading-7 text-muted">
          {infoTab === "how" ? (
            <ol className="list-decimal space-y-2 ps-5">
              {(locale === "ar" ? options.howToUseAr : options.howToUse).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
          {infoTab === "details" ? <p>{locale === "ar" ? product.descriptionAr : product.description}</p> : null}
          {infoTab === "region" ? <p>{locale === "ar" ? options.regionRestrictionsAr : options.regionRestrictions}</p> : null}
          {infoTab === "delivery" ? <p>{locale === "ar" ? options.deliveryEstimateAr : options.deliveryEstimate}</p> : null}
          {infoTab === "refund" ? <p>{locale === "ar" ? options.refundPolicyTextAr : options.refundPolicyText}</p> : null}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-6 text-lg font-semibold">{t("product.faq")}</h2>
        <FaqAccordion items={DIGITAL_PRODUCT_FAQS} locale={locale} columns={2} />
      </section>
      <section className="mt-12">
        <h2 className="mb-6 text-lg font-semibold">{t("product.related")}</h2>
        <ProductRail products={related} />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[35] border-t border-line bg-elevated/96 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="min-w-0">
            <Price amount={price} locale={locale} />
            <p className="truncate text-[11px] text-muted">{[regionName, denomLabel].filter(Boolean).join(" · ")}</p>
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
