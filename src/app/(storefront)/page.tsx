import { Hero } from "@/components/home/hero";
import { CategorySwiperSection } from "@/components/home/category-swiper-section";
import { HomePromoBanner } from "@/components/home/home-promo-banner";
import { HomeSupportCta } from "@/components/home/home-support-cta";
import { HomeTestimonials } from "@/components/home/home-testimonials";
import { LatestProducts } from "@/components/home/latest-products";
import { PlatformQuickLinks } from "@/components/home/platform-quick-links";
import { ServiceCategoryGrid } from "@/components/home/service-category-grid";
import { SuggestedGamesGrid } from "@/components/home/suggested-games-grid";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "Digital gaming cards and top-ups in Jordan",
  "Jordanian store for digital gaming codes, gift cards, wallet credit, subscriptions, and direct top-ups.",
  "/",
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomePromoBanner />
      <PlatformQuickLinks />
      <CategorySwiperSection />
      <LatestProducts />
      <ServiceCategoryGrid />
      <SuggestedGamesGrid />
      <HomeSupportCta />
      <HomeTestimonials />
    </>
  );
}
