import { cn } from "@/lib/cn";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[12px] font-medium text-[var(--clicks-text)]">
        {label}
        {required ? <span className="ms-0.5 text-[var(--clicks-error)]">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-[11px] text-[var(--clicks-muted)]">{hint}</p> : null}
      {error ? <p className="text-[11px] text-[var(--clicks-error)]">{error}</p> : null}
    </div>
  );
}

export const adminInputClass = "admin-input";

export const adminTextareaClass =
  "min-h-[88px] w-full rounded-[var(--admin-radius-sm)] border border-[var(--clicks-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--clicks-blue)] focus:shadow-[0_0_0_3px_var(--clicks-blue-soft)]";

export const adminSelectClass = "admin-input";
