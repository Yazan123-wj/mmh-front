"use client";

import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { useLanguage } from "@/context/language-context";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  const { locale, t } = useLanguage();
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="relative isolate flex min-h-[calc(100dvh-var(--announce-height)-var(--header-height))] w-full flex-col overflow-hidden bg-[#17182b] text-white"
      aria-label={SITE.name}
    >
      <Image
        src="/home/hero-banner.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,24,43,0.55)_0%,rgba(23,24,43,0.35)_42%,rgba(23,24,43,0.82)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_30%,transparent_0%,rgba(23,24,43,0.45)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-end px-5 pb-12 pt-16 text-center sm:px-8 sm:pb-16 sm:pt-20 lg:pb-20">
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.08, duration: reduceMotion ? 0 : 0.45 }}
          className="text-xs font-semibold uppercase tracking-[0.28em] text-gold sm:text-sm"
        >
          {SITE.name}
        </motion.p>
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.14, duration: reduceMotion ? 0 : 0.5 }}
          className="mt-3 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
        >
          {locale === "ar" ? SITE.taglineAr : SITE.tagline}
        </motion.h1>
        <motion.p
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.45 }}
          className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:mt-5 sm:text-base sm:leading-8"
        >
          {t("home.heroSubtitle")}
        </motion.p>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.28, duration: reduceMotion ? 0 : 0.4 }}
          className="mt-8 sm:mt-10"
        >
          <Button href="/shop" size="lg" className="min-w-[220px] px-8 text-[15px]">
            {t("home.shopGear")}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
