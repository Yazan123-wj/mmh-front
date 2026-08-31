import type { Product } from "@/types";
import { cn } from "@/lib/cn";
import { useId } from "react";

const PALETTES: Record<string, { a: string; b: string; c: string }> = {
  pc: { a: "#565895", b: "#22233D", c: "#F7C037" },
  laptop: { a: "#686AB0", b: "#17182B", c: "#B8BAD2" },
  ps5: { a: "#2667FF", b: "#F7F9FF", c: "#123DBB" },
  controller: { a: "#F7F9FF", b: "#22233D", c: "#F7C037" },
  gpu: { a: "#22C55E", b: "#22233D", c: "#F7C037" },
  cpu: { a: "#F5A000", b: "#22233D", c: "#F7F9FF" },
  mouse: { a: "#F7C037", b: "#111318", c: "#565895" },
  digital: { a: "#565895", b: "#17182B", c: "#F7C037" },
};

function paletteFor(key: string) {
  if (key.includes("card-psn") || key.includes("ps5") || key.includes("dualsense") || key.includes("pulse")) {
    return PALETTES.ps5;
  }
  if (key.includes("card-valorant")) return { a: "#FF4655", b: "#17182B", c: "#F7F9FF" };
  if (key.includes("card-mlbb")) return { a: "#3B82F6", b: "#17182B", c: "#F7C037" };
  if (key.includes("card-ff")) return { a: "#F97316", b: "#1A1204", c: "#F7C037" };
  if (key.includes("card-razer")) return { a: "#44D62C", b: "#17182B", c: "#F7F9FF" };
  if (key.includes("card-lol")) return { a: "#C8AA6E", b: "#17182B", c: "#F7C037" };
  if (key.includes("card-psplus") || key.includes("card-psn")) return PALETTES.ps5;
  if (key.includes("card-steam")) return { a: "#66C0F4", b: "#1B2838", c: "#F7C037" };
  if (key.includes("card-xbox")) return { a: "#107C10", b: "#17182B", c: "#F7F9FF" };
  if (key.includes("card-nintendo")) return { a: "#E60012", b: "#17182B", c: "#F7F9FF" };
  if (key.includes("card-ea")) return { a: "#FF4747", b: "#17182B", c: "#F7C037" };
  if (key.includes("card-pubg")) return { a: "#F5A000", b: "#1A1204", c: "#F7F9FF" };
  if (key.includes("card-fortnite")) return { a: "#8B5CF6", b: "#22233D", c: "#F7C037" };
  if (key.includes("card-roblox")) return { a: "#E11D48", b: "#17182B", c: "#F7F9FF" };
  if (key.includes("card-google")) return { a: "#34A853", b: "#17182B", c: "#F7F9FF" };
  if (key.includes("card-apple")) return { a: "#F7F9FF", b: "#111318", c: "#9BA6C5" };
  if (key.includes("gpu") || key.includes("rtx") || key.includes("radeon")) return PALETTES.gpu;
  if (key.includes("cpu") || key.includes("ryzen") || key.includes("intel")) return PALETTES.cpu;
  if (key.includes("mouse") || key.includes("gpx")) return PALETTES.mouse;
  if (key.includes("laptop")) return PALETTES.laptop;
  if (key.includes("pc") || key.includes("apex") || key.includes("nova")) return PALETTES.pc;
  if (key.includes("card") || key.includes("gift") || key.includes("digital")) return PALETTES.digital;
  return PALETTES.pc;
}

function Shape({ artworkKey }: { artworkKey: string }) {
  if (artworkKey.includes("card") || artworkKey.includes("gift")) {
    return (
      <g>
        <rect x="70" y="90" width="220" height="140" rx="16" fill="currentColor" opacity="0.95" />
        <rect x="86" y="108" width="80" height="10" rx="5" fill="#17182B" opacity="0.45" />
        <rect x="86" y="128" width="140" height="8" rx="4" fill="#17182B" opacity="0.28" />
        <circle cx="250" cy="128" r="16" fill="#F7C037" />
        <rect x="86" y="186" width="110" height="18" rx="6" fill="#17182B" opacity="0.35" />
      </g>
    );
  }
  if (artworkKey.includes("laptop")) {
    return (
      <g>
        <rect x="70" y="88" width="220" height="132" rx="10" fill="currentColor" />
        <rect x="82" y="100" width="196" height="108" rx="4" fill="#17182B" />
        <rect x="58" y="220" width="244" height="16" rx="4" fill="currentColor" opacity="0.7" />
      </g>
    );
  }
  if (artworkKey.includes("ps5")) {
    return (
      <g>
        <path d="M150 70c-28 0-46 18-46 70v80c0 36 14 54 38 54h16V70h-8Z" fill="currentColor" />
        <path d="M210 70h8c28 0 46 18 46 70v80c0 36-14 54-38 54h-16V70Z" fill="#F7F9FF" opacity="0.9" />
        <rect x="174" y="92" width="12" height="150" rx="6" fill="#F7C037" />
      </g>
    );
  }
  if (artworkKey.includes("dualsense") || artworkKey.includes("controller")) {
    return (
      <g>
        <path
          d="M90 150c0-28 18-48 48-48h84c30 0 48 20 48 48 0 34-16 62-40 62h-20l-16-28h-28l-16 28h-20c-24 0-40-28-40-62Z"
          fill="currentColor"
        />
        <circle cx="136" cy="148" r="10" fill="#17182B" />
        <circle cx="224" cy="140" r="5" fill="#F7C037" />
        <circle cx="238" cy="154" r="5" fill="#565895" />
      </g>
    );
  }
  if (artworkKey.includes("gpu") || artworkKey.includes("rtx") || artworkKey.includes("radeon")) {
    return (
      <g>
        <rect x="58" y="118" width="244" height="96" rx="10" fill="currentColor" />
        <rect x="74" y="134" width="160" height="64" rx="6" fill="#17182B" opacity="0.45" />
        <circle cx="262" cy="166" r="18" fill="#17182B" opacity="0.5" />
        <circle cx="262" cy="166" r="8" fill="#F7C037" />
      </g>
    );
  }
  if (artworkKey.includes("mouse") || artworkKey.includes("gpx") || artworkKey.includes("g502")) {
    return (
      <g>
        <path d="M180 86c38 0 62 40 62 92 0 62-24 108-62 108s-62-46-62-108c0-52 24-92 62-92Z" fill="currentColor" />
        <path d="M180 108v70" stroke="#17182B" strokeWidth="4" opacity="0.4" />
        <circle cx="180" cy="96" r="6" fill="#F7C037" />
      </g>
    );
  }
  if (artworkKey.includes("hs-") || artworkKey.includes("headset") || artworkKey.includes("pulse") || artworkKey.includes("cloud") || artworkKey.includes("arctis")) {
    return (
      <g>
        <path d="M100 170c0-56 36-96 80-96s80 40 80 96" stroke="currentColor" strokeWidth="18" fill="none" />
        <rect x="82" y="162" width="44" height="70" rx="12" fill="currentColor" />
        <rect x="234" y="162" width="44" height="70" rx="12" fill="currentColor" />
      </g>
    );
  }
  if (artworkKey.includes("monitor")) {
    return (
      <g>
        <rect x="64" y="86" width="232" height="140" rx="10" fill="currentColor" />
        <rect x="76" y="98" width="208" height="116" rx="4" fill="#17182B" />
        <rect x="168" y="226" width="24" height="28" fill="currentColor" />
        <rect x="128" y="252" width="104" height="10" rx="3" fill="currentColor" />
      </g>
    );
  }
  if (artworkKey.includes("chair")) {
    return (
      <g>
        <rect x="130" y="70" width="100" height="90" rx="16" fill="currentColor" />
        <rect x="118" y="168" width="124" height="28" rx="8" fill="currentColor" />
        <rect x="174" y="196" width="12" height="50" fill="currentColor" />
        <rect x="140" y="246" width="80" height="10" rx="4" fill="currentColor" />
      </g>
    );
  }
  if (artworkKey.includes("kb") || artworkKey.includes("keyboard") || artworkKey.includes("huntsman") || artworkKey.includes("g915")) {
    return (
      <g>
        <rect x="54" y="140" width="252" height="88" rx="12" fill="currentColor" />
        {Array.from({ length: 12 }).map((_, index) => (
          <rect key={index} x={70 + (index % 12) * 18} y="158" width="14" height="14" rx="3" fill="#17182B" opacity="0.45" />
        ))}
      </g>
    );
  }
  return (
    <g>
      <rect x="118" y="78" width="124" height="176" rx="14" fill="currentColor" />
      <rect x="132" y="92" width="96" height="148" rx="8" fill="#17182B" opacity="0.35" />
      <rect x="150" y="108" width="12" height="90" rx="4" fill="#F7C037" />
      <circle cx="200" cy="130" r="10" fill="#565895" />
    </g>
  );
}

export type ArtworkShot = "hero" | "angle" | "detail" | "pack";

function shotTransform(shot: ArtworkShot) {
  if (shot === "angle") return "translate(22 10) rotate(-16 180 180)";
  if (shot === "detail") return "translate(-88 -52) scale(1.72)";
  if (shot === "pack") return "translate(56 78) scale(0.58)";
  return undefined;
}

export function ProductArtwork({
  product,
  className,
  label,
  showTypeBadge = false,
  shot = "hero",
  compact = false,
}: {
  product: Pick<Product, "artworkKey" | "brand" | "name" | "type">;
  className?: string;
  label?: string;
  showTypeBadge?: boolean;
  shot?: ArtworkShot;
  compact?: boolean;
}) {
  const palette = paletteFor(product.artworkKey);
  const gradientId = `g-${useId().replace(/:/g, "")}`;
  const glow = shot === "angle" ? { cx: 70, cy: 280 } : shot === "detail" ? { cx: 180, cy: 140 } : { cx: 300, cy: 48 };
  return (
    <div className={cn("relative aspect-square overflow-hidden bg-[#17182B]", className)}>
      <svg viewBox="0 0 360 360" className="h-full w-full rtl:transform-none" role="img" aria-label={label ?? product.name}>
        <defs>
          <radialGradient id={gradientId} cx={shot === "detail" ? "50%" : "50%"} cy={shot === "angle" ? "70%" : "30%"} r="70%">
            <stop offset="0%" stopColor={palette.a} stopOpacity={shot === "detail" ? "0.55" : "0.38"} />
            <stop offset="100%" stopColor="#17182B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="360" height="360" fill="#17182B" />
        <rect width="360" height="360" fill={`url(#${gradientId})`} />
        <circle cx={glow.cx} cy={glow.cy} r="70" fill={palette.c} opacity="0.08" />
        {shot === "pack" ? (
          <g>
            <rect x="52" y="64" width="256" height="248" rx="16" fill="#262743" />
            <rect x="52" y="64" width="256" height="248" rx="16" fill="none" stroke={palette.a} strokeWidth="3" />
            <rect x="52" y="64" width="256" height="42" rx="16" fill={palette.c} opacity="0.9" />
            <rect x="52" y="88" width="256" height="18" fill={palette.c} opacity="0.9" />
            <rect x="168" y="76" width="24" height="10" rx="3" fill="#17182B" opacity="0.35" />
          </g>
        ) : null}
        <g fill={palette.a} color={palette.a} transform={shotTransform(shot)}>
          <Shape artworkKey={product.artworkKey} />
        </g>
      </svg>
      {compact ? null : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17182B] to-transparent p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{product.brand}</p>
        </div>
      )}
      {showTypeBadge && product.type === "digital" ? (
        <span className="absolute start-3 top-3 rounded-md bg-gold/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold">
          Digital
        </span>
      ) : null}
    </div>
  );
}

export function ProductCover({
  product,
  className,
  label,
  showTypeBadge = false,
  shot = "hero",
  compact = false,
  src,
}: {
  product: Pick<Product, "artworkKey" | "brand" | "name" | "type" | "images">;
  className?: string;
  label?: string;
  showTypeBadge?: boolean;
  shot?: ArtworkShot;
  compact?: boolean;
  src?: string;
}) {
  const photo = src ?? product.images[0];
  if (photo) {
    return (
      <div className={cn("relative aspect-square overflow-hidden bg-[#17182B]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={label ?? product.name} className="h-full w-full object-contain p-3" />
        {showTypeBadge && product.type === "digital" ? (
          <span className="absolute start-3 top-3 rounded-md bg-gold/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold">
            Digital
          </span>
        ) : null}
      </div>
    );
  }
  return (
    <ProductArtwork
      product={product}
      className={className}
      label={label}
      showTypeBadge={showTypeBadge}
      shot={shot}
      compact={compact}
    />
  );
}

export function CategoryArtwork({ artworkKey, className }: { artworkKey: string; className?: string }) {
  return (
    <ProductArtwork
      product={{ artworkKey, brand: "MMH", name: artworkKey, type: "digital" }}
      className={className}
    />
  );
}
