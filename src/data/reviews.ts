import type { Review } from "@/types";
import { PRODUCTS } from "@/data/products";

const POOL: Omit<Review, "id" | "productId">[] = [
  {
    author: "Omar K.",
    city: "Amman",
    rating: 5,
    title: "Region warning was clear",
    titleAr: "تحذير المنطقة كان واضحاً",
    body: "I confirmed the PlayStation region before checkout. The demo flow is honest about Phase 2 delivery.",
    bodyAr: "أكّدت منطقة بلايستيشن قبل الدفع. مسار العرض صريح بشأن التسليم في المرحلة الثانية.",
    date: "2026-07-02",
  },
  {
    author: "Lina H.",
    city: "Irbid",
    rating: 4,
    title: "Straightforward top-up fields",
    titleAr: "حقول الشحن واضحة",
    body: "PUBG only asked for Player ID. No extra account fields.",
    bodyAr: "ببجي طلب معرّف اللاعب فقط. بلا نماذج شحن إضافية.",
    date: "2026-06-21",
  },
  {
    author: "Hasan M.",
    city: "Zarqa",
    rating: 5,
    title: "Would buy the digital card again",
    titleAr: "سأشتري البطاقة الرقمية مرة أخرى",
    body: "Prices in JOD and the denomination chips made it easy to pick the right value.",
    bodyAr: "الأسعار بالدينار وفئات القيمة سهّلت الاختيار.",
    date: "2026-08-04",
  },
  {
    author: "Nour A.",
    city: "Amman",
    rating: 5,
    title: "Clean Roblox flow",
    titleAr: "مسار روبلوكس واضح",
    body: "Currency warning sat next to the buy panel, not buried in the description.",
    bodyAr: "تحذير العملة ظاهر بجانب الشراء وليس مخفياً في الوصف.",
    date: "2026-05-30",
  },
];

export function getProductReviews(productId: string): Review[] {
  const product = PRODUCTS.find((item) => item.id === productId);
  const count = Math.min(product?.reviewCount ?? 3, 4);
  return POOL.slice(0, count).map((review, index) => ({
    ...review,
    id: `${productId}-rev-${index}`,
    productId,
  }));
}
