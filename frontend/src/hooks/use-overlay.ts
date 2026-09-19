"use client";

import { useEffect } from "react";

let lockCount = 0;

function applyLock() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = lockCount > 0 ? "hidden" : "";
}

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    lockCount += 1;
    applyLock();
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      applyLock();
    };
  }, [locked]);
}

export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onEscape]);
}
