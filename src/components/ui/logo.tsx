import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="MMH DC home">
      <Image
        src="/brand/IMG_4556.png"
        alt="MMH DC"
        width={size}
        height={size}
        className="brand-mark rounded-full object-contain"
        style={{ width: size, height: size }}
        priority
      />
      <span className="hidden text-[15px] font-semibold tracking-[0.16em] text-fg min-[380px]:inline sm:text-[17px] sm:tracking-[0.18em]">
        MMH DC
      </span>
    </Link>
  );
}
