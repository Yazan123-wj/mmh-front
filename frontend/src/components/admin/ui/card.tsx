import { cn } from "@/lib/cn";

export function AdminCard({
  children,
  className,
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "admin-card",
        padding === "sm" && "p-3",
        padding === "md" && "p-4",
        padding === "none" && "p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminSectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold text-[var(--clicks-navy)]">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-[var(--clicks-muted)]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
