export const REGIONS = [
  { id: "global", name: "Global", nameAr: "عالمي", currency: "USD", locked: false },
  { id: "us", name: "United States", nameAr: "الولايات المتحدة", currency: "USD", locked: true },
  { id: "eu", name: "Europe", nameAr: "أوروبا", currency: "EUR", locked: true },
  { id: "uae", name: "UAE / MENA", nameAr: "الإمارات / الشرق الأوسط", currency: "USD", locked: true },
  { id: "tr", name: "Türkiye", nameAr: "تركيا", currency: "TRY", locked: true },
  { id: "uk", name: "United Kingdom", nameAr: "المملكة المتحدة", currency: "GBP", locked: true },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export function getRegion(id: string) {
  return REGIONS.find((region) => region.id === id);
}
