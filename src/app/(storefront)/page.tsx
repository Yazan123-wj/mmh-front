import { BestSellers } from "@/components/home/best-sellers";
import { BrandsMarquee } from "@/components/home/brands-marquee";
import { DealsSection } from "@/components/home/deals-section";
import { FeaturedStory } from "@/components/home/featured-story";
import { Hero } from "@/components/home/hero";
import { InstantDigital } from "@/components/home/instant-digital";
import { PromoBanners } from "@/components/home/promo-banners";
import { PromoSplit } from "@/components/home/promo-split";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { TrendingProducts } from "@/components/home/trending-products";
import { TrustStrip } from "@/components/home/trust-strip";
import { WhyMmh } from "@/components/home/why-mmh";
import { pageMeta } from "@/lib/seo";
import { loadPublishedBanners } from "@/server/catalog/map";

export const metadata = pageMeta(
  "MMH — Your games. Your credit. Instantly.",
  "Jordanian store for digital gaming codes, gift cards, wallet credit, subscriptions, and direct top-ups.",
  "/",
);

export default async function HomePage() {
  const bannerRows = await loadPublishedBanners().catch(() => []);
  const banners = bannerRows.map((banner) => {
    const en = banner.translations.find((item) => item.locale === "en");
    const ar = banner.translations.find((item) => item.locale === "ar");
    return {
      id: banner.id,
      href: banner.href,
      kicker: banner.kicker ?? "",
      tone: (banner.tone === "gold" ? "gold" : "blue") as "gold" | "blue",
      title: en?.title ?? "",
      titleAr: ar?.title ?? en?.title ?? "",
      subtitle: en?.subtitle ?? "",
      subtitleAr: ar?.subtitle ?? en?.subtitle ?? "",
      cta: en?.ctaLabel ?? "",
      ctaAr: ar?.ctaLabel ?? en?.ctaLabel ?? "",
    };
  });
  return (
    <>
      <Hero />
      <TrustStrip />
      <ShopByCategory />
      <TrendingProducts />
      <InstantDigital />
      <FeaturedStory />
      <PromoBanners items={banners} />
      <PromoSplit />
      <DealsSection />
      <BestSellers />
      <WhyMmh />
      <BrandsMarquee />
    </>
  );
}
