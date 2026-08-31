"use client";

import { ANNOUNCEMENTS } from "@/data/navigation";
import { useLanguage } from "@/context/language-context";
import { useEffect, useState } from "react";

export function AnnouncementBar() {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ANNOUNCEMENTS.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative z-30 border-b border-line bg-elevated pt-[env(safe-area-inset-top)] text-center text-[12px] text-muted">
      <p className="flex min-h-9 items-center justify-center px-4 py-2 leading-snug tracking-wide sm:h-9 sm:py-0">
        {t(ANNOUNCEMENTS[index].key)}
      </p>
    </div>
  );
}
