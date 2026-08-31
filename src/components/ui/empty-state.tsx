import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}

export function EmptyState({ icon, title, body, actionHref, actionLabel, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[12px] border border-dashed border-line bg-card/50 px-6 py-16 text-center", className)}>
      {icon ? <div className="mb-4 text-muted">{icon}</div> : null}
      <h2 className="text-lg font-semibold">{title}</h2>
      {body ? <p className="mt-2 max-w-md text-sm text-muted">{body}</p> : null}
      {actionHref && actionLabel ? (
        <Button className="mt-6" href={actionHref}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
