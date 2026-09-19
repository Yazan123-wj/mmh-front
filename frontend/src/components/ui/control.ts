import { cn } from "@/lib/cn";

export const FOCUS_RING =
  "mmh-focus outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-elevated";

export const CONTROL =
  `h-11 w-full rounded-[12px] border border-line bg-elevated px-3 text-base text-fg placeholder:text-subtle transition-colors hover:border-accent/58 disabled:bg-elevated/62 disabled:text-muted/52 aria-expanded:border-brand md:text-sm ${FOCUS_RING} focus-visible:border-gold`;

export const TEXTAREA = `min-h-32 w-full rounded-[12px] border border-line bg-elevated p-3 text-base text-fg placeholder:text-subtle transition-colors hover:border-accent/58 disabled:bg-elevated/62 disabled:text-muted/52 md:text-sm ${FOCUS_RING} focus-visible:border-gold`;

export const ICON_HIT = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] text-muted transition-colors hover:bg-brand/16 hover:text-gold ${FOCUS_RING}`;

export function chipClass(selected: boolean, className?: string) {
  return cn(
    "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
    FOCUS_RING,
    selected ? "border-gold bg-gold/12 text-fg" : "border-line text-fg hover:border-line-strong",
    className,
  );
}

export function choiceClass(selected: boolean, className?: string) {
  return cn(
    "rounded-[10px] border px-3 text-sm transition-colors",
    FOCUS_RING,
    selected ? "border-gold bg-brand/20 text-fg" : "border-line text-fg hover:border-line-strong",
    className,
  );
}
