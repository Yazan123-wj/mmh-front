import { SITE } from "@/config/site";
import type { Metadata } from "next";

export function pageMeta(title: string, description: string, path = "/"): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_JO",
      images: [{ url: "/brand/IMG_4556.png", width: 512, height: 512, alt: "MMH" }],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
