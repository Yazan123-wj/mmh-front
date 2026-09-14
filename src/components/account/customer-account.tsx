"use client";

import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { useLanguage } from "@/context/language-context";
import { formatDate } from "@/lib/format";
import { KeyRound, PackageCheck, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export interface CustomerOrderSummary {
  id: string;
  number: string;
  createdAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalJod: number;
  items: Array<{ id: string; name: string; nameAr: string; quantity: number; fulfillmentType: "CODE" | "DIRECT_TOPUP"; fields: Array<{ label: string; maskedValue: string }>; codes: Array<{ masked: string }> }>;
}

export function CustomerAccount({ profile, orders }: { profile: { name: string; email: string; phone: string }; orders: CustomerOrderSummary[] }) {
  const { locale } = useLanguage();
  const codeCount = orders.flatMap((order) => order.items).filter((item) => item.fulfillmentType === "CODE").length;
  const topupCount = orders.flatMap((order) => order.items).filter((item) => item.fulfillmentType === "DIRECT_TOPUP").length;
  const cards = [
    { href: "/account/orders", label: locale === "ar" ? "الطلبات" : "Orders", count: orders.length, icon: ShoppingBag },
    { href: "/account/codes", label: locale === "ar" ? "الأكواد" : "Codes", count: codeCount, icon: KeyRound },
    { href: "/account/top-ups", label: locale === "ar" ? "عمليات الشحن" : "Top-ups", count: topupCount, icon: PackageCheck },
  ];
  return <div className="container-mmh py-8 sm:py-12"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">MMH</p><h1 className="mt-2 text-3xl font-bold">{profile.name}</h1><p className="mt-1 text-sm text-muted">{profile.email}{profile.phone ? ` · ${profile.phone}` : ""}</p></div><Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>{locale === "ar" ? "تسجيل الخروج" : "Sign out"}</Button></div><div className="mt-8 grid gap-3 sm:grid-cols-3">{cards.map(({ href, label, count, icon: Icon }) => <Link key={href} href={href} className="rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:border-brand/30"><Icon className="h-5 w-5 text-brand" /><p className="mt-4 text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-bold">{count}</p></Link>)}</div><section className="mt-10"><h2 className="font-semibold">{locale === "ar" ? "الملف الشخصي" : "Profile"}</h2><div className="mt-3 flex items-start gap-3 rounded-2xl border border-line bg-card p-5"><UserRound className="h-5 w-5 text-brand" /><div><p className="font-medium">{profile.name}</p><p className="text-sm text-muted">{profile.email}</p><p className="text-sm text-muted">{profile.phone}</p></div></div></section></div>;
}

export function CustomerOrders({ orders, mode = "all" }: { orders: CustomerOrderSummary[]; mode?: "all" | "codes" | "topups" }) {
  const { locale } = useLanguage();
  const title = mode === "codes" ? (locale === "ar" ? "الأكواد الرقمية" : "Digital codes") : mode === "topups" ? (locale === "ar" ? "عمليات الشحن" : "Top-ups") : (locale === "ar" ? "طلباتي" : "My orders");
  const filtered = orders.map((order) => ({ ...order, items: order.items.filter((item) => mode === "all" || (mode === "codes" ? item.fulfillmentType === "CODE" : item.fulfillmentType === "DIRECT_TOPUP")) })).filter((order) => order.items.length);
  return <div className="container-mmh py-8 sm:py-12"><h1 className="text-3xl font-bold">{title}</h1>{filtered.length ? <div className="mt-7 space-y-4">{filtered.map((order) => <article key={order.id} className="rounded-2xl border border-line bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/account/orders/${order.number}`} className="font-bold text-brand-deep">{order.number}</Link><p className="mt-1 text-xs text-muted">{formatDate(order.createdAt, locale)}</p></div><Price amount={order.totalJod} locale={locale} /></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-gold/16 px-3 py-1.5">{locale === "ar" ? "الدفع" : "Payment"}: {order.paymentStatus}</span><span className="rounded-full bg-elevated px-3 py-1.5">{locale === "ar" ? "التنفيذ" : "Fulfillment"}: {order.fulfillmentStatus}</span></div><ul className="mt-4 divide-y divide-line">{order.items.map((item) => <li key={item.id} className="py-3 text-sm"><p className="font-medium">{locale === "ar" ? item.nameAr : item.name} × {item.quantity}</p>{item.fields.map((field) => <p key={field.label} className="mt-1 text-xs text-muted">{field.label}: {field.maskedValue}</p>)}{item.codes.map((code) => <p key={code.masked} className="mt-1 font-mono text-xs text-muted">{locale === "ar" ? "الكود" : "Code"}: {code.masked}</p>)}</li>)}</ul></article>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">{locale === "ar" ? "لا توجد طلبات هنا بعد." : "No orders here yet."}<div><Button className="mt-5" href="/shop">{locale === "ar" ? "تصفح المنتجات" : "Browse products"}</Button></div></div>}</div>;
}
