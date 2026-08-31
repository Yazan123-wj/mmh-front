"use client";

import { SectionHeading } from "@/components/ui/section-heading";
import { BRANDS } from "@/data/brands";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";

export function BrandsMarquee() {
  const { t } = useLanguage();
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="overflow-hidden border-y border-line py-10 md:py-14">
      <div className="container-mmh">
        <SectionHeading title={t("home.brands")} subtitle={t("home.brandsSub")} actionHref="/brands" actionLabel={t("common.viewAll")} />
      </div>
      <div className="flex animate-[marquee_32s_linear_infinite] gap-10 whitespace-nowrap px-6 text-sm uppercase tracking-[0.2em] text-muted motion-reduce:animate-none">
        {row.map((brand, index) => (
          <Link key={`${brand.slug}-${index}`} href={`/brands#${brand.slug}`} className="hover:text-fg">
            {brand.name}
          </Link>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } } html[dir="rtl"] .animate-\\[marquee_32s_linear_infinite\\] { animation-direction: reverse; }`}</style>
    </section>
  );
}
