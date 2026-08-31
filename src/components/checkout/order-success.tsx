"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { DEMO_CODE, DEMO_CODE_REVEALED, maskAccountValue } from "@/lib/cart";
import { STORAGE_KEYS, readJson } from "@/lib/storage";
import { useHydrated } from "@/hooks/use-client";
import { getProductById } from "@/data/products";
import type { CartItem, CheckoutDraft } from "@/types";
import { useState } from "react";

interface LastCheckout {
  draft?: CheckoutDraft;
  items?: CartItem[];
  total?: number;
  createdAt?: string;
  orderId?: string;
}

export function OrderSuccessView() {
  const { t, locale } = useLanguage();
  const hydrated = useHydrated();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const last = hydrated ? readJson<LastCheckout | null>(STORAGE_KEYS.checkout, null) : null;
  const items = last?.items ?? [];

  return (
    <div className="container-mmh max-w-2xl py-10 md:py-16">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">MMH</p>
      <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{t("success.title")}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{t("success.body")}</p>
      <p className="mt-4 text-sm text-muted">
        {t("success.orderNo")} · {last?.orderId ?? "MMH-DEMO"}
      </p>
      <p className="mt-1 text-sm text-muted">{t("success.payment")}</p>
      <div className="mt-8 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-[14px] border border-gold/25 bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-gold">{t("common.digital")}</p>
            <p className="mt-3 break-all font-mono text-lg tracking-[0.18em] sm:text-2xl sm:tracking-[0.3em]">{revealed.demo ? DEMO_CODE_REVEALED : DEMO_CODE}</p>
            <Button className="mt-4" onClick={() => setRevealed({ demo: true })}>
              {t("product.revealDemo")}
            </Button>
            {revealed.demo ? <p className="mt-3 text-sm text-amber">{t("product.demoOnly")}</p> : null}
          </div>
        ) : (
          items.map((item) => {
            const product = getProductById(item.productId);
            const isTopup = product?.fulfillmentType === "direct_topup";
            const player = item.digital?.customerFields?.playerId || item.digital?.customerFields?.userId;
            return (
              <article key={item.lineId} className="rounded-[14px] border border-gold/25 bg-card p-5">
                <p className="font-medium">{product ? (locale === "ar" ? product.nameAr : product.name) : item.productId}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.digital?.platform} · {item.digital?.regionName} · {item.digital?.denominationLabel}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {t("success.fulfillment")}: {isTopup ? t("status.awaiting") : t("status.ready")}
                </p>
                {player ? <p className="mt-1 text-xs text-muted">{maskAccountValue(player)}</p> : null}
                {!isTopup ? (
                  <>
                    <p className="mt-3 break-all font-mono text-lg tracking-[0.18em] sm:text-2xl sm:tracking-[0.3em]">
                      {revealed[item.lineId] ? DEMO_CODE_REVEALED : DEMO_CODE}
                    </p>
                    <Button className="mt-4" onClick={() => setRevealed((current) => ({ ...current, [item.lineId]: true }))}>
                      {t("product.revealDemo")}
                    </Button>
                    {revealed[item.lineId] ? <p className="mt-3 text-sm text-amber">{t("product.demoOnly")}</p> : null}
                  </>
                ) : null}
              </article>
            );
          })
        )}
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button className="w-full sm:w-auto" href="/account/orders">{t("success.orders")}</Button>
        <Button className="w-full sm:w-auto" variant="outline" href="/shop">
          {t("success.continue")}
        </Button>
      </div>
    </div>
  );
}
