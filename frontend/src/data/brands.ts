import type { Brand } from "@/types";

export const BRANDS: Brand[] = [
  {
    slug: "playstation",
    name: "PlayStation",
    nameAr: "بلايستيشن",
    description: "PlayStation Store cards and Plus membership codes sold by MMH.",
    descriptionAr: "بطاقات بلايستيشن ستور وأكواد عضوية بلس تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "steam",
    name: "Steam",
    nameAr: "ستيم",
    description: "Steam Wallet cards fulfilled as digital codes.",
    descriptionAr: "بطاقات محفظة ستيم تُسلّم كأكواد رقمية.",
    soldByMmh: true,
  },
  {
    slug: "xbox",
    name: "Xbox",
    nameAr: "إكس بوكس",
    description: "Xbox gift cards sold by MMH.",
    descriptionAr: "بطاقات هدايا إكس بوكس تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "nintendo",
    name: "Nintendo",
    nameAr: "نينتندو",
    description: "Nintendo eShop cards sold by MMH.",
    descriptionAr: "بطاقات نينتندو إي شوب تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "apple",
    name: "Apple",
    nameAr: "آبل",
    description: "Apple gift cards sold by MMH.",
    descriptionAr: "بطاقات هدايا آبل تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "google",
    name: "Google",
    nameAr: "جوجل",
    description: "Google Play gift cards sold by MMH.",
    descriptionAr: "بطاقات جوجل بلاي تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "razer",
    name: "Razer",
    nameAr: "ريزر",
    description: "Razer Gold PINs sold by MMH.",
    descriptionAr: "أرقام ريزر جولد تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "roblox",
    name: "Roblox",
    nameAr: "روبلوكس",
    description: "Roblox gift cards sold by MMH.",
    descriptionAr: "بطاقات روبلوكس تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "pubg",
    name: "PUBG",
    nameAr: "ببجي",
    description: "PUBG Mobile UC direct top-ups sold by MMH.",
    descriptionAr: "شحن شدات ببجي موبايل يُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "garena",
    name: "Garena",
    nameAr: "غارينا",
    description: "Free Fire diamond top-ups sold by MMH.",
    descriptionAr: "شحن جواهر فري فاير يُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "moonton",
    name: "Moonton",
    nameAr: "موونتون",
    description: "Mobile Legends diamond top-ups sold by MMH.",
    descriptionAr: "شحن ماس موبايل ليجندز يُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "riot",
    name: "Riot",
    nameAr: "رايوت",
    description: "Valorant and League of Legends codes sold by MMH.",
    descriptionAr: "أكواد فالورانت وليغ أوف ليجندز تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "epic",
    name: "Epic",
    nameAr: "إبك",
    description: "Fortnite V-Bucks cards sold by MMH.",
    descriptionAr: "بطاقات فورتنايت في-بكس تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
  {
    slug: "ea",
    name: "EA",
    nameAr: "إي إيه",
    description: "EA Sports FC Points sold by MMH.",
    descriptionAr: "نقاط EA Sports FC تُباع عبر إم إم إتش.",
    soldByMmh: true,
  },
];

export function getBrand(slugOrName: string): Brand | undefined {
  const needle = slugOrName.toLowerCase();
  return BRANDS.find(
    (brand) => brand.slug === needle || brand.name.toLowerCase() === needle,
  );
}
