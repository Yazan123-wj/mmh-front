import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("admin-card p-3.5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[var(--clicks-muted)]">{label}</p>
          <p className="mt-1.5 text-[1.375rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--clicks-navy)]">
            {value}
          </p>
          {hint ? <p className="mt-1.5 text-[11px] leading-snug text-[var(--clicks-muted)]">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--admin-radius-sm)] bg-[var(--clicks-blue-soft)] text-[var(--clicks-blue)]">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
