"use client";

import { useLanguage } from "@/context/language-context";
import Link from "next/link";
import { PROMOTIONAL_BANNERS } from "@/data/promotional-banners";

export interface StoreBanner {
  id: string;
  href: string;
  kicker: string;
  tone: "gold" | "blue";
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  cta: string;
  ctaAr: string;
}

export function PromoBanners({ items }: { items?: StoreBanner[] }) {
  const { t, locale } = useLanguage();
  const banners =
    items && items.length > 0
      ? items.slice(0, 2)
      : PROMOTIONAL_BANNERS.slice(0, 2).map((banner) => ({
          id: banner.id,
          href: banner.href,
          kicker: banner.kicker,
          tone: banner.tone,
          title: t(banner.titleKey),
          titleAr: t(banner.titleKey),
          subtitle: t(banner.bodyKey),
          subtitleAr: t(banner.bodyKey),
          cta: t(banner.ctaKey),
          ctaAr: t(banner.ctaKey),
        }));
  return (
    <section className="container-mmh grid gap-4 py-6 md:grid-cols-2">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          href={banner.href}
          className="relative min-h-[180px] overflow-hidden rounded-[14px] border border-line bg-card p-5 sm:min-h-[200px] sm:p-8"
        >
          <div
            className={`absolute end-[-20%] top-[-30%] h-64 w-64 rounded-full blur-3xl ${
              banner.tone === "gold" ? "bg-gold/15" : "bg-accent/20"
            }`}
          />
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold">{banner.kicker}</p>
          <h3 className="mt-3 max-w-sm text-2xl font-semibold md:text-3xl">{locale === "ar" ? banner.titleAr : banner.title}</h3>
          <p className="mt-3 max-w-sm text-sm text-muted">{locale === "ar" ? banner.subtitleAr : banner.subtitle}</p>
          <p className="mt-5 text-sm font-medium text-gold">{locale === "ar" ? banner.ctaAr : banner.cta}</p>
        </Link>
      ))}
    </section>
  );
}
