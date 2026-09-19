"use client";

import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLanguage } from "@/context/language-context";
import type { FaqItem } from "@/data/faq";
import { Headphones, ShieldCheck } from "lucide-react";

export function StoreInformation({ faqs }: { faqs: FaqItem[] }) {
  const { locale } = useLanguage();
  return (
    <>
      {faqs.length ? (
        <section className="container-mmh py-10 md:py-16">
          <SectionHeading title={locale === "ar" ? "الأسئلة الشائعة" : "Frequently asked questions"} subtitle={locale === "ar" ? "إجابات واضحة قبل إتمام طلبك الرقمي." : "Clear answers before you complete a digital order."} actionHref="/faq" actionLabel={locale === "ar" ? "كل الأسئلة" : "View all"} />
          <FaqAccordion items={faqs.slice(0, 6)} locale={locale} columns={2} />
        </section>
      ) : null}
      <section className="container-mmh pb-12 md:pb-16">
        <div className="grid overflow-hidden rounded-2xl bg-brand-deep text-white md:grid-cols-[1fr_auto] md:items-center">
          <div className="p-6 sm:p-9">
            <div className="flex items-center gap-2 text-gold"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">MMH</span></div>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{locale === "ar" ? "تحتاج مساعدة قبل الطلب؟" : "Need help before ordering?"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">{locale === "ar" ? "راجع معلومات المنطقة والمنصة وتفاصيل الشحن المباشر قبل إنشاء الطلب." : "Review account region, platform, and direct top-up details before creating an order."}</p>
          </div>
          <div className="flex items-center gap-3 px-6 pb-6 md:px-9 md:pb-0"><Headphones className="hidden h-8 w-8 text-gold sm:block" /><Button href="/contact">{locale === "ar" ? "تواصل مع الدعم" : "Contact support"}</Button></div>
        </div>
      </section>
    </>
  );
}
