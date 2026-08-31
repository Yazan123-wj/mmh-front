"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductArtwork } from "@/components/product/product-artwork";
import { MOCK_ORDERS } from "@/data/mock-orders";
import { useAccount } from "@/context/account-context";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/context/toast-context";
import { useWishlist } from "@/context/wishlist-context";
import { getProductById } from "@/data/products";
import { formatDate } from "@/lib/format";
import { DEMO_CODE, DEMO_CODE_REVEALED } from "@/lib/cart";
import Link from "next/link";
import { useState } from "react";

export function AccountDashboard() {
  const { user, logout, hydrated } = useAccount();
  const { items } = useWishlist();
  const { t, locale } = useLanguage();
  if (!hydrated) return <div className="container-mmh py-16">{t("common.loading")}</div>;
  if (!user) {
    return (
      <div className="container-mmh py-16">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t("account.title")}</h1>
        <p className="mt-3 text-sm text-muted">{t("auth.demo")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:w-auto" href="/login">{t("account.signIn")}</Button>
          <Button className="w-full sm:w-auto" variant="secondary" href="/register">{t("account.register")}</Button>
        </div>
      </div>
    );
  }
  const codes = MOCK_ORDERS.flatMap((order) => order.items.filter((item) => item.fulfillmentType === "code"));
  const topups = MOCK_ORDERS.flatMap((order) => order.items.filter((item) => item.fulfillmentType === "direct_topup"));
  return (
    <div className="container-mmh py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold">{t("account.guest")}</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{user.name}</h1>
          <p className="break-all text-sm text-muted">{user.email} · {user.phone}</p>
        </div>
        <Button variant="secondary" onClick={logout}>{t("account.signOut")}</Button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Link href="/account/orders" className="rounded-[12px] border border-line bg-card p-5">
          <p className="text-sm text-muted">{t("account.orders")}</p>
          <p className="mt-2 text-2xl font-semibold">{MOCK_ORDERS.length}</p>
        </Link>
        <Link href="/account/codes" className="rounded-[12px] border border-line bg-card p-5">
          <p className="text-sm text-muted">{t("account.codes")}</p>
          <p className="mt-2 text-2xl font-semibold">{codes.length}</p>
        </Link>
        <Link href="/account/top-ups" className="rounded-[12px] border border-line bg-card p-5">
          <p className="text-sm text-muted">{t("account.topups")}</p>
          <p className="mt-2 text-2xl font-semibold">{topups.length}</p>
        </Link>
        <Link href="/wishlist" className="rounded-[12px] border border-line bg-card p-5">
          <p className="text-sm text-muted">{t("nav.wishlist")}</p>
          <p className="mt-2 text-2xl font-semibold">{items.length}</p>
        </Link>
      </div>
      <section className="mt-10">
        <h2 className="mb-4 font-semibold">{t("account.profile")}</h2>
        <article className="rounded-[12px] border border-line bg-card p-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="mt-1 text-muted">{user.email}</p>
          <p className="text-muted">{user.phone}</p>
        </article>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 font-semibold">{t("account.orders")}</h2>
        <ul className="space-y-3">
          {MOCK_ORDERS.slice(0, 2).map((order) => (
            <li key={order.id} className="flex flex-col gap-1 rounded-[12px] border border-line bg-card p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{order.id} · {formatDate(order.createdAt, locale)}</span>
              <span className="text-muted">{t(`status.${order.status}`)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="mb-4 font-semibold">{t("account.support")}</h2>
        <Button href="/contact" variant="secondary">{t("footer.contact")}</Button>
      </section>
    </div>
  );
}

export function OrdersView() {
  const { t, locale } = useLanguage();
  if (MOCK_ORDERS.length === 0) return <EmptyState title={t("empty.orders")} />;
  return (
    <div className="container-mmh py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">{t("account.orders")}</h1>
      <div className="mt-8 space-y-4">
        {MOCK_ORDERS.map((order) => (
          <article key={order.id} className="rounded-[12px] border border-line bg-card p-5">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <strong>{order.id}</strong>
              <span className="text-muted">{formatDate(order.createdAt, locale)} · {t(`status.${order.status}`)}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.productId}`}>
                  {locale === "ar" ? item.nameAr : item.name} · {item.region} · {item.denomination} · {item.priceJod} {t("common.jod")}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

export function CodesView() {
  const { t, locale } = useLanguage();
  const { push } = useToast();
  const [open, setOpen] = useState<string | null>(null);
  const codes = MOCK_ORDERS.flatMap((order) =>
    order.items.filter((item) => item.fulfillmentType === "code").map((item) => ({ ...item, orderId: order.id, date: order.createdAt })),
  );
  if (codes.length === 0) return <EmptyState title={t("empty.codes")} />;
  return (
    <div className="container-mmh py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">{t("account.codes")}</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {codes.map((item) => {
          const product = getProductById(item.productId);
          const shown = open === `${item.orderId}-${item.productId}`;
          return (
            <article key={`${item.orderId}-${item.productId}`} className="rounded-[12px] border border-line bg-card p-4">
              {product ? <div className="mb-3 h-32 overflow-hidden rounded-[10px]"><ProductArtwork product={product} /></div> : null}
              <p className="font-medium">{locale === "ar" ? item.nameAr : item.name}</p>
              <p className="mt-1 text-xs text-muted">{item.region} · {item.denomination} · {formatDate(item.date, locale)}</p>
              <p className="mt-2 break-all font-mono text-sm tracking-[0.18em] sm:text-base sm:tracking-[0.25em]">{shown ? DEMO_CODE_REVEALED : item.digitalMaskedCode ?? DEMO_CODE}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button className="w-full sm:w-auto" onClick={() => setOpen(`${item.orderId}-${item.productId}`)}>
                  {t("product.revealDemo")}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(DEMO_CODE_REVEALED);
                    push({ title: t("common.copied"), tone: "success" });
                  }}
                >
                  {t("common.copy")}
                </Button>
              </div>
              {shown ? <p className="mt-2 text-xs text-amber">{t("product.demoOnly")}</p> : null}
              {product ? (
                <p className="mt-3 text-xs leading-5 text-muted">{locale === "ar" ? product.digitalOptions.instructionsAr : product.digitalOptions.instructions}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function TopUpsView() {
  const { t, locale } = useLanguage();
  const topups = MOCK_ORDERS.flatMap((order) =>
    order.items.filter((item) => item.fulfillmentType === "direct_topup").map((item) => ({ ...item, orderId: order.id, date: order.createdAt })),
  );
  if (topups.length === 0) return <EmptyState title={t("empty.topups")} />;
  return (
    <div className="container-mmh py-10">
      <h1 className="text-2xl font-semibold sm:text-3xl">{t("account.topups")}</h1>
      <div className="mt-8 space-y-4">
        {topups.map((item) => {
          const product = getProductById(item.productId);
          return (
            <article key={`${item.orderId}-${item.productId}`} className="rounded-[12px] border border-line bg-card p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-medium">{locale === "ar" ? item.nameAr : item.name}</p>
                <span className={item.topUpStatus === "completed" ? "text-sm text-success" : item.topUpStatus === "failed" ? "text-sm text-danger" : "text-sm text-gold"}>{t(`status.${item.topUpStatus ?? "awaiting"}`)}</span>
              </div>
              <p className="mt-2 text-sm text-muted">
                {item.denomination} · {item.region} · {item.playerIdMasked}
              </p>
              <p className="mt-1 text-xs text-muted">{formatDate(item.date, locale)}</p>
              <Button className="mt-4" variant="secondary" href="/contact">
                {t("account.support")}
              </Button>
              {product ? <p className="mt-3 text-xs text-muted">{locale === "ar" ? product.digitalOptions.platformLabelAr : product.digitalOptions.platformLabel}</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
