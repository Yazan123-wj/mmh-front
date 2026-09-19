import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-card flex flex-col items-center justify-center border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F5F9] text-[var(--clicks-muted)]">
        <Icon className="h-4.5 w-4.5 h-4 w-4" strokeWidth={1.75} />
      </span>
      <h2 className="mt-3 text-[13px] font-semibold text-[var(--clicks-navy)]">{title}</h2>
      {description ? <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-[var(--clicks-muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
