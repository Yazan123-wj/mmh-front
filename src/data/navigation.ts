import type { NavLink } from "@/types";

export const NAV_LINKS: NavLink[] = [
  { href: "/shop", labelKey: "nav.shop", mega: "shop" },
  { href: "/game-top-ups", labelKey: "nav.topups", mega: "topups" },
  { href: "/gift-cards", labelKey: "nav.gifts", mega: "gifts" },
  { href: "/category/playstation", labelKey: "nav.playstation", mega: "playstation" },
  { href: "/category/steam", labelKey: "nav.steam" },
  { href: "/category/mobile-games", labelKey: "nav.mobile", mega: "mobile" },
  { href: "/category/subscriptions", labelKey: "nav.subscriptions" },
  { href: "/deals", labelKey: "nav.deals" },
];

export const ANNOUNCEMENTS = [
  { key: "announce.jordan" },
  { key: "announce.instant" },
  { key: "announce.secure" },
] as const;

export const FOOTER_COLUMNS = [
  {
    titleKey: "footer.shop",
    links: [
      { href: "/shop", labelKey: "nav.shop" },
      { href: "/game-top-ups", labelKey: "nav.topups" },
      { href: "/gift-cards", labelKey: "nav.gifts" },
      { href: "/category/playstation", labelKey: "nav.playstation" },
      { href: "/deals", labelKey: "nav.deals" },
      { href: "/brands", labelKey: "nav.brands" },
    ],
  },
  {
    titleKey: "footer.care",
    links: [
      { href: "/account", labelKey: "nav.account" },
      { href: "/account/orders", labelKey: "account.orders" },
      { href: "/account/codes", labelKey: "account.codes" },
      { href: "/account/top-ups", labelKey: "account.topups" },
      { href: "/wishlist", labelKey: "nav.wishlist" },
      { href: "/faq", labelKey: "footer.faq" },
      { href: "/contact", labelKey: "footer.contact" },
    ],
  },
  {
    titleKey: "footer.digital",
    links: [
      { href: "/game-top-ups", labelKey: "nav.topups" },
      { href: "/gift-cards", labelKey: "nav.gifts" },
      { href: "/digital-product-policy", labelKey: "footer.digitalPolicy" },
    ],
  },
  {
    titleKey: "footer.company",
    links: [
      { href: "/about", labelKey: "footer.about" },
      { href: "/contact", labelKey: "footer.contact" },
      { href: "/privacy", labelKey: "footer.privacy" },
      { href: "/terms", labelKey: "footer.terms" },
    ],
  },
] as const;

export const TRENDING_SEARCHES = [
  "Roblox",
  "100 Robux",
  "PUBG UC",
  "PlayStation US",
  "Steam USD",
  "Apple Gift Card",
  "Google Play",
  "Free Fire",
];
