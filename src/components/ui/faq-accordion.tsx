"use client";

import { cn } from "@/lib/cn";
import type { FaqItem } from "@/data/faq";
import type { Locale } from "@/types";
import { ChevronDown } from "lucide-react";

export function FaqAccordion({
  items,
  locale,
  columns = 1,
}: {
  items: FaqItem[];
  locale: Locale;
  columns?: 1 | 2;
}) {
  return (
    <div className={cn("grid gap-3", columns === 2 && "md:grid-cols-2")}>
      {items.map((item) => (
        <details
          key={item.id}
          className="group rounded-[14px] border border-line bg-card open:border-gold/40 open:bg-gold/[0.04]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="leading-snug">{locale === "ar" ? item.questionAr : item.question}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180 group-open:text-gold" />
          </summary>
          <p className="border-t border-line px-5 py-4 text-sm leading-6 text-muted">
            {locale === "ar" ? item.answerAr : item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
