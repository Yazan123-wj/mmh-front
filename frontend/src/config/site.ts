export const SITE = {
  name: "MMH",
  legalName: "MMH",
  tagline: "Your games. Your credit. One place.",
  taglineAr: "ألعابك. رصيدك. في مكان واحد.",
  description:
    "MMH is a Jordanian store for digital gaming codes, gift cards, wallet credit, subscriptions, and selected direct account top-ups.",
  descriptionAr:
    "إم إم إتش متجر أردني لأكواد الألعاب الرقمية وبطاقات الهدايا ورصيد المحافظ والاشتراكات وشحن الحسابات المباشر.",
  url: "http://localhost:3001",
  currency: "JOD",
  currencyLabel: "JOD",
  localeDefault: "en" as const,
  contact: {
    phone: "",
    phoneNote: "",
    email: "",
    emailNote: "",
    address: "",
    city: "Amman, Jordan",
    hours: "",
    instagram: "#",
    facebook: "#",
    tiktok: "#",
    youtube: "#",
    /** Opens Telegram chat / channel */
    telegram: "https://t.me/mmhstore",
    /** Opens WhatsApp chat */
    whatsapp: "https://wa.me/962790000000",
  },
  delivery: {
    estimate: "Issued after payment is confirmed. Live PIN delivery is not enabled in this environment.",
    estimateAr: "يُصدر بعد تأكيد الدفع. تسليم الأرقام الحية غير مفعّل في هذه البيئة.",
    topupEstimate: "Submitted for processing after checkout",
    topupEstimateAr: "يُرسل للمعالجة بعد إتمام الطلب",
  },
} as const;
