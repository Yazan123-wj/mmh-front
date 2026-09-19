"use client";

import { cn } from "@/lib/cn";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "info" | "success" | "error" | "warning";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex max-w-md items-start gap-2.5 rounded-[var(--admin-radius)] border bg-white px-3.5 py-2.5 text-[13px] shadow-[var(--admin-shadow-hover)]",
                item.tone === "success" && "border-emerald-200",
                item.tone === "error" && "border-red-200",
                item.tone === "warning" && "border-amber-200",
                item.tone === "info" && "border-[var(--clicks-border)]",
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  item.tone === "success" && "text-emerald-600",
                  item.tone === "error" && "text-red-600",
                  item.tone === "warning" && "text-amber-600",
                  item.tone === "info" && "text-[var(--clicks-blue)]",
                )}
              />
              <p className="flex-1 text-[var(--clicks-navy)]">{item.message}</p>
              <button
                type="button"
                className="rounded p-0.5 text-[var(--clicks-muted)] hover:bg-[#F5F7FB]"
                onClick={() => setItems((prev) => prev.filter((t) => t.id !== item.id))}
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: (message: string) => {
        if (typeof window !== "undefined") console.info("[admin toast]", message);
      },
    };
  }
  return ctx;
}
