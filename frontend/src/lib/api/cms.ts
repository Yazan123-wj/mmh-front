import { apiFetch } from "@/lib/api/client";

export function listBanners() {
  return apiFetch("/cms/banners/");
}

export function listFaqs() {
  return apiFetch("/cms/faqs/");
}

export function getPage(slug: string) {
  return apiFetch(`/cms/pages/${slug}/`);
}
