import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "admin-btn admin-btn-primary",
  secondary: "admin-btn admin-btn-secondary",
  ghost: "admin-btn admin-btn-ghost",
  danger: "admin-btn admin-btn-danger",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs",
  md: "",
};

export function AdminButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return <button type="button" className={cn(VARIANT[variant], SIZE[size], className)} {...props} />;
}
