"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { uid } from "@/lib/id";
import type { ToastMessage } from "@/types";

interface ToastContextValue {
  toasts: ToastMessage[];
  push: (toast: Omit<ToastMessage, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

    const push = useCallback(
      (toast: Omit<ToastMessage, "id">) => {
        const id = uid("toast");
        setToasts((current) => {
          if (current.some((item) => item.title === toast.title && item.description === toast.description)) {
            return current;
          }
          return [...current, { ...toast, id }];
        });
        window.setTimeout(() => dismiss(id), 3800);
      },
      [dismiss],
    );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
