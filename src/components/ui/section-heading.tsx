import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import Link from "next/link";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionHref,
  actionLabel,
  className,
  children,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm leading-6 text-muted md:text-[15px]">{subtitle}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="text-sm font-medium text-accent hover:text-gold">
          {actionLabel}
        </Link>
      ) : (
        children
      )}
    </div>
  );
}
