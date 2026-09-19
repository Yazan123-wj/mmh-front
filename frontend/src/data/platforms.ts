export const PLATFORMS = [
  { id: "playstation", name: "PlayStation", nameAr: "بلايستيشن" },
  { id: "steam", name: "Steam", nameAr: "ستيم" },
  { id: "xbox", name: "Xbox", nameAr: "إكس بوكس" },
  { id: "nintendo", name: "Nintendo", nameAr: "نينتندو" },
  { id: "apple", name: "Apple", nameAr: "آبل" },
  { id: "google", name: "Google Play", nameAr: "جوجل بلاي" },
  { id: "razer", name: "Razer Gold", nameAr: "ريزر جولد" },
  { id: "roblox", name: "Roblox", nameAr: "روبلوكس" },
  { id: "pubg", name: "PUBG Mobile", nameAr: "ببجي موبايل" },
  { id: "freefire", name: "Free Fire", nameAr: "فري فاير" },
  { id: "mlbb", name: "Mobile Legends", nameAr: "موبايل ليجندز" },
  { id: "valorant", name: "Valorant", nameAr: "فالورانت" },
  { id: "fortnite", name: "Fortnite", nameAr: "فورتنايت" },
  { id: "lol", name: "League of Legends", nameAr: "ليج أوف ليجندز" },
  { id: "ea", name: "EA Sports FC", nameAr: "إي إيه سبورتس إف سي" },
] as const;

export function getPlatform(id: string) {
  return PLATFORMS.find((platform) => platform.id === id);
}
