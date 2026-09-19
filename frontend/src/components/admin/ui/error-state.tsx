import { cn } from "@/lib/cn";
import { AlertTriangle } from "lucide-react";

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-card flex flex-col items-center justify-center border-[var(--clicks-error)]/20 bg-[#FEF2F2] px-6 py-10 text-center",
        className,
      )}
    >
      <AlertTriangle className="h-5 w-5 text-[var(--clicks-error)]" />
      <h2 className="mt-3 text-[13px] font-semibold text-[var(--clicks-navy)]">{title}</h2>
      {message ? <p className="mt-1 max-w-md text-[12px] text-[var(--clicks-muted)]">{message}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="admin-btn admin-btn-primary mt-4">
          Try again
        </button>
      ) : null}
    </div>
  );
}
