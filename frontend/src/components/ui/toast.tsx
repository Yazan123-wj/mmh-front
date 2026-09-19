"use client";

import { useToast } from "@/context/toast-context";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[max(6.5rem,calc(5.5rem+env(safe-area-inset-bottom)))] z-[90] flex w-[min(100%-2rem,360px)] flex-col gap-2 sm:inset-x-auto sm:end-4 sm:top-24 sm:bottom-auto">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "pointer-events-auto rounded-[12px] border border-line bg-elevated p-3 shadow-xl",
              toast.tone === "error" && "border-danger/40",
              toast.tone === "success" && "border-success/40",
              toast.tone === "info" && "border-accent/40",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-xs text-muted">{toast.description}</p> : null}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} className="text-muted hover:text-fg" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
