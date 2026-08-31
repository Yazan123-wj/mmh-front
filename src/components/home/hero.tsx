"use client";

import { Button } from "@/components/ui/button";
import { ProductArtwork } from "@/components/product/product-artwork";
import { getProductById } from "@/data/products";
import { useLanguage } from "@/context/language-context";
import { motion, useReducedMotion } from "framer-motion";

export function Hero() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();
  const psn = getProductById("psn-store")!;
  const roblox = getProductById("roblox-card")!;
  const pubg = getProductById("pubg-uc")!;

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute start-[-10%] top-[-20%] h-[420px] w-[420px] rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute end-[10%] top-[20%] h-[240px] w-[240px] rounded-full bg-gold/10 blur-3xl" />
      </div>
      <div className="container-mmh grid items-center gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">MMH · Amman</p>
          <h1 className="mt-3 max-w-xl text-[28px] font-semibold leading-[1.1] tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">
            {t("home.heroTitle")}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted md:text-lg">{t("home.heroSubtitle")}</p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
            <Button size="lg" href="/gift-cards" className="w-full sm:w-auto">
              {t("home.shopGear")}
            </Button>
            <Button size="lg" variant="outline" href="/game-top-ups" className="w-full sm:w-auto">
              {t("home.exploreDigital")}
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-muted">
            <span className="rounded-md border border-line px-2 py-1">PlayStation · from JOD 8.9</span>
            <span className="rounded-md border border-line px-2 py-1">PUBG Mobile UC</span>
            <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-1 text-gold">Instant codes</span>
          </div>
        </motion.div>
        <div className="relative mx-auto w-full max-w-[520px] sm:h-[420px]">
          <motion.div
            className="relative w-full overflow-hidden rounded-[14px] border border-line glow-purple sm:absolute sm:start-8 sm:top-6 sm:w-[58%]"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ProductArtwork product={psn} />
          </motion.div>
          <motion.div
            className="absolute end-4 top-24 hidden w-[42%] overflow-hidden rounded-[14px] border border-line sm:block"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProductArtwork product={roblox} />
          </motion.div>
          <motion.div
            className="absolute bottom-4 start-16 hidden w-[36%] overflow-hidden rounded-[14px] border border-gold/30 sm:block"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ProductArtwork product={pubg} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
