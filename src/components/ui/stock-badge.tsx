import { cn } from "@/lib/cn";

interface StockBadgeProps {
  inStock: boolean;
  quantity?: number;
  inLabel: string;
  lowLabel: string;
  outLabel: string;
}

export function StockBadge({ inStock, quantity, inLabel, lowLabel, outLabel }: StockBadgeProps) {
  const low = inStock && typeof quantity === "number" && quantity > 0 && quantity <= 5;
  const label = !inStock ? outLabel : low ? lowLabel : inLabel;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", !inStock ? "text-danger" : low ? "text-amber" : "text-success")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", !inStock ? "bg-danger" : low ? "bg-amber" : "bg-success")} />
      {label}
      {low ? ` · ${quantity}` : null}
    </span>
  );
}
