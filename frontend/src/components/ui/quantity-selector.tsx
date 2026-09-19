"use client";

import { FOCUS_RING } from "@/components/ui/control";
import { cn } from "@/lib/cn";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function QuantitySelector({ value, onChange, min = 1, max = 10, label }: QuantitySelectorProps) {
  return (
    <div className="inline-flex h-11 items-center rounded-[12px] border border-line bg-elevated">
      <button
        type="button"
        className={cn("flex h-11 w-11 items-center justify-center rounded-[12px] text-muted hover:text-fg", FOCUS_RING)}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn("min-w-8 text-center text-sm font-semibold")} aria-label={label}>
        {value}
      </span>
      <button
        type="button"
        className={cn("flex h-11 w-11 items-center justify-center rounded-[12px] text-muted hover:text-fg", FOCUS_RING)}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
