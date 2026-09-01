export const SITE = {
  name: "MMH",
  legalName: "MMH",
  tagline: "Your games. Your credit. Instantly.",
  taglineAr: "ألعابك. رصيدك. فوراً.",
  description:
    "MMH is a Jordanian store for digital gaming codes, gift cards, wallet credit, subscriptions, and selected direct account top-ups.",
  descriptionAr:
    "إم إم إتش متجر أردني لأكواد الألعاب الرقمية وبطاقات الهدايا ورصيد المحافظ والاشتراكات وشحن الحسابات المباشر.",
  url: "http://localhost:3001",
  currency: "JOD",
  currencyLabel: "JOD",
  localeDefault: "en" as const,
  contact: {
    phone: "+962 7X XXX XXXX",
    phoneNote: "Placeholder — replace with the official MMH number.",
    email: "hello@example.com",
    emailNote: "Placeholder — replace with the official MMH inbox.",
    address: "[Amman store address — update before launch]",
    city: "Amman, Jordan",
    hours: "[Store hours — update before launch]",
    instagram: "#",
    facebook: "#",
    tiktok: "#",
    youtube: "#",
  },
  delivery: {
    estimate: "Issued after payment is confirmed. Live PIN delivery is not enabled in this environment.",
    estimateAr: "يُصدر بعد تأكيد الدفع. تسليم الأرقام الحية غير مفعّل في هذه البيئة.",
    topupEstimate: "Submitted for processing after checkout",
    topupEstimateAr: "يُرسل للمعالجة بعد إتمام الطلب",
  },
  campaignEndsAt: "2026-09-15T21:00:00+03:00",
  promoCodes: {
    MMH10: { type: "percent" as const, value: 10 },
    GAME20: { type: "flat" as const, value: 20 },
  },
} as const;
