import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 overflow-hidden text-xs text-muted sm:mb-6 sm:text-sm">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex max-w-full items-center gap-1">
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-fg">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "line-clamp-1 text-fg" : undefined}>{item.label}</span>
            )}
            {!last ? <ChevronRight className="h-3.5 w-3.5 shrink-0 rtl:rotate-180" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
