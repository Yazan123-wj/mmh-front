"use client";

import { HOME_TESTIMONIALS } from "@/data/home";
import { useLanguage } from "@/context/language-context";
import { Star } from "lucide-react";

export function HomeTestimonials() {
  const { t } = useLanguage();

  return (
    <section className="container-mmh py-6 pb-12 sm:py-8 sm:pb-16">
      <h2 className="mb-5 text-center text-xl font-bold tracking-tight sm:mb-6 sm:text-2xl">{t("home.testimonials")}</h2>
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {HOME_TESTIMONIALS.map((item) => (
          <article key={item.id} className="rounded-2xl border border-line bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-deep text-sm font-bold text-gold">
                {t(item.nameKey).slice(0, 1)}
              </span>
              <div>
                <p className="text-sm font-semibold">{t(item.nameKey)}</p>
                <p className="mt-0.5 flex gap-0.5 text-gold" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-gold" />
                  ))}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">{t(item.bodyKey)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
