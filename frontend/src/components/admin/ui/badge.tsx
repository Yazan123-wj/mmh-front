import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-900 ring-amber-600/15",
  error: "bg-red-50 text-red-800 ring-red-600/15",
  info: "bg-[var(--clicks-blue-soft)] text-[var(--clicks-blue)] ring-[var(--clicks-blue)]/15",
  neutral: "bg-[#F3F5F9] text-[var(--clicks-muted)] ring-[var(--clicks-border)]",
};

const STATUS_TONE: Record<string, keyof typeof TONE> = {
  PUBLISHED: "success",
  ACTIVE: "success",
  COMPLETED: "success",
  PAID: "success",
  AVAILABLE: "success",
  IN_STOCK: "success",
  MAPPED: "success",
  DRAFT: "neutral",
  INACTIVE: "neutral",
  DISABLED: "neutral",
  ARCHIVED: "neutral",
  PENDING: "warning",
  PROCESSING: "warning",
  QUEUED: "warning",
  AUTHORIZED: "warning",
  RESERVED: "warning",
  LOW_STOCK: "warning",
  MANUAL_REVIEW: "warning",
  FAILED: "error",
  CANCELLED: "error",
  REFUNDED: "error",
  PARTIALLY_REFUNDED: "warning",
  OUT_OF_STOCK: "error",
  UNAVAILABLE: "error",
  UNMAPPED: "neutral",
  LIVE_LOCKED: "warning",
  MOCK: "info",
  TEST: "info",
};

export function Badge({
  children,
  tone,
  status,
  className,
}: {
  children?: React.ReactNode;
  tone?: keyof typeof TONE;
  status?: string;
  className?: string;
}) {
  const key = status?.toUpperCase().replaceAll(" ", "_") ?? "";
  const resolved = tone ?? (key ? STATUS_TONE[key] : undefined) ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ring-1 ring-inset",
        TONE[resolved],
        className,
      )}
    >
      {children ?? status?.replaceAll("_", " ")}
    </span>
  );
}
