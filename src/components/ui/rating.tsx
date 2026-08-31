import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface RatingProps {
  value: number;
  count?: number;
  reviewsLabel?: string;
  size?: "sm" | "md";
}

export function Rating({ value, count, reviewsLabel = "reviews", size = "sm" }: RatingProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-muted", size === "sm" ? "text-xs" : "text-sm")}>
      <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
      <span className="font-medium text-fg">{value.toFixed(1)}</span>
      {typeof count === "number" ? (
        <span>
          ({count} {reviewsLabel})
        </span>
      ) : null}
    </span>
  );
}
