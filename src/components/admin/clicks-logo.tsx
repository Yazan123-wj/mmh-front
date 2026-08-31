export function ClicksLogo({ variant = "dark", className }: { variant?: "dark" | "light"; className?: string }) {
  const mark = variant === "dark" ? "#FFFFFF" : "#0040FD";
  const word = variant === "dark" ? "#FFFFFF" : "#0B1538";
  const sub = variant === "dark" ? "rgba(255,255,255,0.72)" : "#616674";
  return (
    <span className={className} aria-label="Clicks Digitals">
      <svg width="168" height="28" viewBox="0 0 168 28" fill="none">
        <rect x="0" y="2" width="24" height="24" rx="6" fill={mark} />
        <path d="M7 14.5c0-3.2 2.1-5.2 5.1-5.2 2.2 0 3.8 1 4.7 2.5l-2.3 1.3c-.5-.8-1.3-1.4-2.4-1.4-1.6 0-2.7 1.2-2.7 2.8s1.1 2.8 2.7 2.8c1.1 0 1.9-.6 2.4-1.4l2.3 1.3c-.9 1.5-2.5 2.5-4.7 2.5-3 0-5.1-2-5.1-5.2Z" fill={variant === "dark" ? "#0B1538" : "#FFFFFF"} />
        <text x="32" y="13" fill={word} fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">
          Clicks
        </text>
        <text x="32" y="24" fill={sub} fontSize="8" fontWeight="600" fontFamily="system-ui,sans-serif" letterSpacing="1.4">
          DIGITALS
        </text>
      </svg>
    </span>
  );
}
