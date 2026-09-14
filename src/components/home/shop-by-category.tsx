"use client";

import { CategoryTileImage } from "@/components/home/category-tile-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { CATEGORIES, HOME_CATEGORIES, HOME_CATEGORY_IMAGES } from "@/data/categories";
import { getSnapshotCategories } from "@/lib/catalog-snapshot";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";

export function ShopByCategory() {
  const { t, locale } = useLanguage();
  const databaseCategories = getSnapshotCategories();
  const catalog = databaseCategories.length ? databaseCategories : CATEGORIES;
  const preferred = HOME_CATEGORIES.map((slug) => ({
    slug,
    category: catalog.find((category) => category.slug === slug),
  })).filter((item): item is { slug: (typeof HOME_CATEGORIES)[number]; category: (typeof catalog)[number] } => Boolean(item.category));
  const items = preferred.length >= 4
    ? preferred
    : catalog.filter((category) => !category.parent).slice(0, 8).map((category) => ({ slug: category.slug, category }));

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
              src={HOME_CATEGORY_IMAGES[slug as keyof typeof HOME_CATEGORY_IMAGES]}
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
