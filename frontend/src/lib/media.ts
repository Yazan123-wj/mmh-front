import { getApiBaseUrl } from "@/lib/api/client";

/** Resolve media/catalog image URLs without hardcoding localhost. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  // Static storefront catalog assets live on the Next origin
  if (url.startsWith("/catalog/")) return url;
  const apiRoot = getApiBaseUrl().replace(/\/api\/v1\/?$/, "");
  if (url.startsWith("/")) return `${apiRoot}${url}`;
  return url;
}
