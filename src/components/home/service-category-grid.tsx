"use client";

import { CategoryTileImage } from "@/components/home/category-tile-image";
import { HOME_SERVICE_TILES } from "@/data/home";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";

export function ServiceCategoryGrid() {
  const { t } = useLanguage();

  return (
    <section className="container-mmh py-6 sm:py-8">
      <h2 className="mb-4 text-center text-xl font-bold tracking-tight sm:mb-6 sm:text-2xl">{t("home.services")}</h2>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {HOME_SERVICE_TILES.map((tile) => (
          <Link
            key={tile.id}
            href={tile.href}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-[#17182b] transition hover:border-gold/40"
          >
            <CategoryTileImage
              src={tile.image}
              alt=""
              artworkKey={tile.artworkKey}
              className="absolute inset-0 h-full w-full opacity-90 transition duration-300 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#17182b] via-[#17182b]/35 to-transparent" />
            <p className="absolute inset-x-0 bottom-0 p-2 text-[11px] font-semibold leading-tight text-white sm:p-4 sm:text-base">
              {t(tile.labelKey)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
