"use client";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { FOCUS_RING } from "@/components/ui/control";
import { useLanguage } from "@/context/language-context";
import { DEMO_CODE_REVEALED } from "@/lib/cart";
import { STORAGE_KEYS, readJson } from "@/lib/storage";
import { cn } from "@/lib/cn";
import { CheckCircle2, Clock3, Copy, Check, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface SafeOrderStatus {
  number: string;
  totalJod: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  paymentMethod: string;
  items: Array<{
    id: string;
    name: string;
    nameAr: string;
    quantity: number;
    unitPriceJod: number;
    fulfillmentType?: "CODE" | "DIRECT_TOPUP";
    fields: Array<{ label: string; maskedValue: string }>;
    codes: Array<{ masked: string; value?: string }>;
  }>;
}

function CodeGiftCard({
  title,
  subtitle,
  code,
  pending,
  topup,
  locale,
}: {
  title: string;
  subtitle?: string;
  code?: string;
  pending?: boolean;
  topup?: boolean;
  locale: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 p-[1px]",
        "bg-[linear-gradient(135deg,rgba(247,192,55,0.55),rgba(104,106,176,0.35),rgba(86,88,149,0.2))]",
        "shadow-[0_30px_80px_rgba(10,11,22,0.45)]",
      )}
    >
      <div className="relative overflow-hidden rounded-[27px] bg-[linear-gradient(160deg,#2b2c4a_0%,#22233d_45%,#17182b_100%)] px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -end-16 -top-20 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -start-10 bottom-0 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">MMH</p>
            <p className="mt-3 text-lg font-semibold leading-snug text-white sm:text-xl">{title}</p>
            {subtitle ? <p className="mt-1 text-sm text-white/55">{subtitle}</p> : null}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
            {pending ? <Clock3 className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
        </div>

        <div className="relative mt-8 rounded-2xl border border-dashed border-white/20 bg-black/25 px-4 py-6 text-center backdrop-blur-sm">
          {code ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {locale === "ar" ? "كودك الرقمي" : "Your digital code"}
              </p>
              <p className="mt-3 break-all font-mono text-2xl font-bold tracking-[0.12em] text-gold sm:text-3xl">
                {code}
              </p>
              <button
                type="button"
                onClick={copy}
                className={cn(
                  "mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 text-sm font-semibold text-gold transition hover:bg-gold/20",
                  FOCUS_RING,
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied
                  ? locale === "ar"
                    ? "تم النسخ"
                    : "Copied"
                  : locale === "ar"
                    ? "نسخ الكود"
                    : "Copy code"}
              </button>
            </>
          ) : pending ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {locale === "ar" ? "الكود" : "Code"}
              </p>
              <p className="mt-3 font-mono text-xl tracking-[0.2em] text-white/35">••••-••••-••••</p>
              <p className="mt-4 text-sm text-white/55">
                {locale === "ar"
                  ? "سيظهر الكود هنا بعد تأكيد الدفع والتنفيذ."
                  : "Your code will appear here after payment is verified."}
              </p>
            </>
          ) : topup ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {locale === "ar" ? "الشحن المباشر" : "Direct top-up"}
              </p>
              <p className="mt-3 text-base font-semibold text-white">
                {locale === "ar" ? "تم تأكيد الشحن على الحساب" : "Top-up confirmed for the account"}
              </p>
              <p className="mt-2 text-sm text-white/55">
                {locale === "ar"
                  ? "هذا المنتج لا يُصدر كوداً قابلاً للاسترداد."
                  : "This product does not issue a redeemable code."}
              </p>
            </>
          ) : (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {locale === "ar" ? "التسليم" : "Delivery"}
              </p>
              <p className="mt-3 text-base font-semibold text-white">
                {locale === "ar" ? "لا يوجد كود قابل للاسترداد لهذا المنتج." : "No redeemable code for this product."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function OrderSuccessView({ order }: { order: SafeOrderStatus | null }) {
  const { locale } = useLanguage();
  const [demoOrder, setDemoOrder] = useState<SafeOrderStatus | null>(null);

  useEffect(() => {
    if (order) return;
    const draft = readJson<{
      orderId?: string;
      quickBuy?: boolean;
      total?: number;
      items?: Array<{
        productId: string;
        quantity: number;
        digital?: { denominationLabel?: string; platform?: string };
      }>;
    } | null>(STORAGE_KEYS.checkout, null);
    if (!draft?.quickBuy || !draft.orderId?.startsWith("demo-")) return;
    const first = draft.items?.[0];
    const label = first?.digital?.denominationLabel || (locale === "ar" ? "منتج رقمي" : "Digital product");
    setDemoOrder({
      number: draft.orderId.slice(-8).toUpperCase(),
      totalJod: draft.total ?? 0,
      currency: "JOD",
      paymentStatus: "PAID",
      fulfillmentStatus: "COMPLETED",
      paymentMethod: "demo",
      items: [
        {
          id: "demo-item",
          name: label,
          nameAr: label,
          quantity: first?.quantity ?? 1,
          unitPriceJod: draft.total ?? 0,
          fulfillmentType: "CODE",
          fields: [],
          codes: [{ masked: "DE••••XX", value: DEMO_CODE_REVEALED }],
        },
      ],
    });
  }, [order, locale]);

  const view = order ?? demoOrder;

  const primaryCode = useMemo(() => {
    if (!view) return undefined;
    for (const item of view.items) {
      const code = item.codes.find((entry) => entry.value || entry.masked);
      if (code) return { item, value: code.value ?? code.masked };
    }
    return undefined;
  }, [view]);

  if (!view) {
    return (
      <div className="container-mmh max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-semibold">{locale === "ar" ? "تعذر عرض الطلب" : "Order unavailable"}</h1>
        <p className="mt-3 text-sm text-muted">
          {locale === "ar"
            ? "استخدم رابط تأكيد الطلب الكامل أو تواصل مع الدعم."
            : "Use the complete order confirmation link or contact support."}
        </p>
        <Button className="mt-6" href="/shop">
          {locale === "ar" ? "متابعة التسوق" : "Continue shopping"}
        </Button>
      </div>
    );
  }

  const pending = view.paymentStatus === "PENDING";
  const paid = view.paymentStatus === "PAID";
  const codeReady = Boolean(primaryCode?.value) && paid && view.fulfillmentStatus === "COMPLETED";
  const expectsCode =
    view.items.some((item) => item.fulfillmentType === "CODE") ||
    view.items.some((item) => item.codes.length > 0);
  const isTopup = view.items.every((item) => item.fulfillmentType === "DIRECT_TOPUP");
  const cardTitle = primaryCode
    ? locale === "ar"
      ? primaryCode.item.nameAr
      : primaryCode.item.name
    : locale === "ar"
      ? view.items[0]?.nameAr ?? "طلب MMH"
      : view.items[0]?.name ?? "MMH order";
  const cardSubtitle =
    primaryCode && primaryCode.item.quantity > 1
      ? `× ${primaryCode.item.quantity}`
      : view.items[0]?.fields[0]
        ? `${view.items[0].fields[0].label}: ${view.items[0].fields[0].maskedValue}`
        : undefined;

  return (
    <div className="container-mmh max-w-3xl py-10 md:py-16">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep">
          MMH · {view.number}
        </p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
          {pending
            ? locale === "ar"
              ? "تم استلام طلبك وهو بانتظار الدفع"
              : "Your order is received and awaiting payment"
            : codeReady
              ? locale === "ar"
                ? "تم الدفع — كودك جاهز"
                : "Payment confirmed — your code is ready"
              : locale === "ar"
                ? "تم تأكيد طلبك"
                : "Your order is confirmed"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">
          {pending
            ? locale === "ar"
              ? "لن يبدأ تسليم المنتج الرقمي حتى يتم التحقق من الدفع."
              : "Digital delivery will not start until payment is verified."
            : codeReady
              ? locale === "ar"
                ? "احفظ الكود في مكان آمن. يمكنك نسخه من البطاقة أدناه."
                : "Save your code somewhere safe. You can copy it from the card below."
              : locale === "ar"
                ? "ستظهر حالة التنفيذ أدناه. الشحن المباشر لا يُصدر كوداً."
                : "Fulfillment status is below. Direct top-ups do not issue a redeemable code."}
        </p>
      </div>

      <div className="mt-8 sm:mt-10">
        <CodeGiftCard
          title={cardTitle}
          subtitle={cardSubtitle}
          code={codeReady ? primaryCode?.value : undefined}
          pending={pending || (expectsCode && !codeReady)}
          topup={!pending && isTopup && !codeReady}
          locale={locale}
        />
      </div>

      <div className="mx-auto mt-8 max-w-md space-y-4 sm:mt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-card p-4 text-center sm:text-start">
            <p className="text-xs text-muted">{locale === "ar" ? "الدفع" : "Payment"}</p>
            <p className="mt-1 font-semibold">{view.paymentStatus}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4 text-center sm:text-start">
            <p className="text-xs text-muted">{locale === "ar" ? "التنفيذ" : "Fulfillment"}</p>
            <p className="mt-1 font-semibold">{view.fulfillmentStatus}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-4 text-center sm:text-start">
            <p className="text-xs text-muted">{locale === "ar" ? "الإجمالي" : "Total"}</p>
            <p className="mt-1 font-semibold">
              <Price amount={view.totalJod} locale={locale} size="sm" />
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">{locale === "ar" ? "تفاصيل الطلب" : "Order details"}</h2>
          <ul className="mt-3 divide-y divide-line">
            {view.items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex justify-between gap-4">
                  <span className="font-medium">
                    {locale === "ar" ? item.nameAr : item.name} × {item.quantity}
                  </span>
                  <Price amount={item.unitPriceJod * item.quantity} locale={locale} size="sm" />
                </div>
                {item.fields.map((field) => (
                  <p key={`${item.id}-${field.label}`} className="mt-1 text-xs text-muted">
                    {field.label}: {field.maskedValue}
                  </p>
                ))}
                {item.codes.map((code, index) => (
                  <p key={`${item.id}-code-${index}`} className="mt-1 font-mono text-xs text-gold">
                    {locale === "ar" ? "الكود" : "Code"}: {code.value ?? code.masked}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex items-start gap-3 rounded-xl border border-brand/15 bg-brand/5 p-4 text-sm text-muted">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <p>
            {locale === "ar"
              ? "احتفظ برقم الطلب. لا تعرض إم إم إتش أي كود رقمي قبل الدفع والتنفيذ المصرح به."
              : "Keep your order number. MMH never reveals a digital code before verified payment and authorized fulfillment."}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/account/orders">{locale === "ar" ? "عرض طلباتي" : "View orders"}</Button>
          <Button href="/shop" variant="outline">
            {locale === "ar" ? "متابعة التسوق" : "Continue shopping"}
          </Button>
          <Button href="/contact" variant="ghost">
            {locale === "ar" ? "الدعم" : "Support"}
          </Button>
        </div>
      </div>
    </div>
  );
}
