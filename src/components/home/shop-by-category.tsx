"use client";

import { CategoryTileImage } from "@/components/home/category-tile-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { CATEGORIES, HOME_CATEGORIES, HOME_CATEGORY_IMAGES } from "@/data/categories";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";

export function ShopByCategory() {
  const { t, locale } = useLanguage();
  const items = HOME_CATEGORIES.map((slug) => ({
    slug,
    category: CATEGORIES.find((category) => category.slug === slug)!,
  }));

  return (
    <section className="container-mmh py-10 md:py-16">
      <SectionHeading title={t("home.shopByCategory")} subtitle={t("home.shopByCategorySub")} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {items.map(({ slug, category }) => (
          <Link
            key={slug}
            href={category.href}
            className="group overflow-hidden rounded-[12px] border border-line bg-card transition-colors hover:border-gold/38"
          >
            <CategoryTileImage
              src={HOME_CATEGORY_IMAGES[slug]}
              alt={locale === "ar" ? category.nameAr : category.name}
              artworkKey={category.artworkKey}
              className="aspect-[4/3]"
            />
            <p className="px-3 py-3 text-sm font-semibold">{locale === "ar" ? category.nameAr : category.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
