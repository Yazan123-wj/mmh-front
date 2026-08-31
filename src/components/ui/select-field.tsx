"use client";

import { CONTROL, FOCUS_RING } from "@/components/ui/control";
import { cn } from "@/lib/cn";
import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  children?: ReactNode;
}

interface OptionItem {
  value: string;
  label: string;
  disabled?: boolean;
}

function readOptions(children: ReactNode): OptionItem[] {
  const items: OptionItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return;
    if (child.type !== "option") return;
    items.push({
      value: String(child.props.value ?? ""),
      label: String(child.props.children ?? ""),
      disabled: Boolean(child.props.disabled),
    });
  });
  return items;
}

export function SelectField({ label, className, id, children, disabled, value, onChange, name, "aria-label": ariaLabel }: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? autoId;
  const options = readOptions(children);
  const selected = options.find((option) => option.value === String(value ?? "")) ?? options[0];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  const place = () => {
    const node = buttonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(280, Math.max(120, openUp ? spaceAbove : spaceBelow));
    setBox({
      top: openUp ? rect.top - maxHeight - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  };

  const close = () => setOpen(false);

  const toggle = () => {
    if (disabled) return;
    if (open) {
      close();
      return;
    }
    place();
    setOpen(true);
  };

  const choose = (next: string) => {
    onChange?.({ target: { value: next, name: name ?? "" } } as ChangeEvent<HTMLSelectElement>);
    close();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const onReposition = () => place();
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open]);

  const trigger = (
    <button
      ref={buttonRef}
      id={fieldId}
      type="button"
      data-keep-focus=""
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label={label ?? ariaLabel}
      onClick={toggle}
      className={cn(CONTROL, "relative flex items-center justify-between gap-3 pe-9 text-start")}
    >
      <span className="truncate">{selected?.label ?? ""}</span>
      <span className={cn("pointer-events-none absolute end-3 text-muted transition-transform", open && "rotate-180")} aria-hidden>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );

  const menu =
    open && box && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            data-keep-focus=""
            className="fixed z-[70] overflow-y-auto rounded-[12px] border border-line bg-card p-1 shadow-[0_24px_60px_rgba(16,17,31,0.55)]"
            style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
          >
            {options.map((option) => {
              const active = option.value === String(value ?? "");
              return (
                <button
                  key={option.value || "__all"}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  data-keep-focus=""
                  className={cn(
                    "flex min-h-10 w-full items-center rounded-[10px] px-3 text-start text-sm",
                    FOCUS_RING,
                    active ? "bg-gold/10 text-fg" : "text-muted hover:bg-brand/18 hover:text-fg",
                    option.disabled && "text-[#6F718C]",
                  )}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  if (!label) {
    return (
      <div className={cn("relative", className)}>
        {trigger}
        {menu}
      </div>
    );
  }

  return (
    <div className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-fg">{label}</span>
      {trigger}
      {menu}
    </div>
  );
}
