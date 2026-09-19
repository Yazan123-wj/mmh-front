"use client";

import { useEffect } from "react";

const BLUR_CONTROL =
  "button, a, [role='button'], [role='menuitem'], [role='tab'], [role='switch'], input[type='button'], input[type='submit'], input[type='checkbox'], input[type='radio']";

function setMode(mode: "pointer" | "keyboard") {
  document.documentElement.dataset.input = mode;
}

export function FocusMode() {
  useEffect(() => {
    setMode("pointer");

    const onPointerDown = () => setMode("pointer");

    const onClick = (event: MouseEvent) => {
      if (event.detail === 0) return;
      setMode("pointer");
      const control = event.target instanceof Element ? event.target.closest(BLUR_CONTROL) : null;
      if (!(control instanceof HTMLElement)) return;
      if (control.closest("select, input, textarea, [contenteditable='true'], [data-keep-focus]")) return;
      if (control.getAttribute("aria-expanded") === "true" || control.getAttribute("aria-haspopup") === "listbox") return;
      window.setTimeout(() => {
        if (document.documentElement.dataset.input !== "pointer") return;
        if (document.activeElement === control) control.blur();
      }, 0);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Tab" || event.key.startsWith("Arrow")) {
        setMode("keyboard");
      }
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("click", onClick, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);

  return null;
}
