"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

const HERO_IMAGE = "/home/hero.png";

export function Hero() {
  const { t } = useLanguage();
  const reduce = useReducedMotion();

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
        <motion.div
          className="relative mx-auto w-full max-w-[520px]"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.55 }}
        >
          <div className="overflow-hidden rounded-[14px] border border-line bg-[#17182B] glow-purple">
            <Image
              src={HERO_IMAGE}
              alt="PlayStation, Roblox, and PUBG Mobile digital products at MMH"
              width={1040}
              height={840}
              priority
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 520px"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
