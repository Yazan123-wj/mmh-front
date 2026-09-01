import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import path from "node:path";

export const CATALOG_FETCH_HOSTS = new Set(["upload.wikimedia.org", "commons.wikimedia.org"]);
export const ONEEPIN_IMAGE_HOSTS = new Set(["www.1epin.com"]);
export const ONEEPIN_IMAGE_PATH_PREFIXES = ["/images/oyun/", "/images/kategoriler/"];
export const CATALOG_FETCH_USER_AGENT =
  "MMHCatalogBot/1.0 (catalog enrichment; https://github.com/Yazan123-wj/mmh-front)";
export const MAX_REMOTE_BYTES = 1_500_000;
export const MAX_REDIRECTS = 3;

const PRIVATE_V4 = [
  [0, 0xff000000], // 0.0.0.0/8
  [0x0a000000, 0xff000000], // 10.0.0.0/8
  [0x7f000000, 0xff000000], // 127.0.0.0/8
  [0xa9fe0000, 0xffff0000], // 169.254.0.0/16
  [0xac100000, 0xfff00000], // 172.16.0.0/12
  [0xc0a80000, 0xffff0000], // 192.168.0.0/16
];

export class UnsafeRemoteUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeRemoteUrlError";
  }
}

export function isPrivateIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const n = address.split(".").reduce((acc, part) => ((acc << 8) + Number(part)) >>> 0, 0);
    return PRIVATE_V4.some(([base, mask]) => ((n & mask) >>> 0) === base);
  }
  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) {
      return true;
    }
    if (normalized.includes(".")) {
      const v4 = normalized.split(":").pop() ?? "";
      if (isIP(v4) === 4) return isPrivateIp(v4);
    }
  }
  return false;
}

export async function assertSafePublicHttpsUrl(
  raw: string,
  allowedHosts: Set<string> = CATALOG_FETCH_HOSTS,
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeRemoteUrlError("Invalid remote URL.");
  }
  if (url.protocol !== "https:") {
    throw new UnsafeRemoteUrlError("Remote media URLs must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new UnsafeRemoteUrlError("Remote media URLs must not include credentials.");
  }
  if (!allowedHosts.has(url.hostname)) {
    throw new UnsafeRemoteUrlError("Remote media host is not allowlisted.");
  }
  if (isIP(url.hostname) && isPrivateIp(url.hostname)) {
    throw new UnsafeRemoteUrlError("Remote media host resolves to a private network.");
  }
  const records = await lookup(url.hostname, { all: true });
  if (records.length === 0) {
    throw new UnsafeRemoteUrlError("Remote media host could not be resolved.");
  }
  if (records.some((record) => isPrivateIp(record.address))) {
    throw new UnsafeRemoteUrlError("Remote media host resolves to a private network.");
  }
  return url;
}

export async function assertSafeOneEpinImageUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeRemoteUrlError("Invalid remote URL.");
  }
  if (url.protocol !== "https:") {
    throw new UnsafeRemoteUrlError("Remote media URLs must use HTTPS.");
  }
  if (!ONEEPIN_IMAGE_HOSTS.has(url.hostname)) {
    throw new UnsafeRemoteUrlError("Remote media host is not allowlisted.");
  }
  const normalized = url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`;
  if (!ONEEPIN_IMAGE_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    throw new UnsafeRemoteUrlError("1Epin image path is not allowlisted.");
  }
  if (!/\.(webp|png|jpe?g|avif)$/i.test(normalized)) {
    throw new UnsafeRemoteUrlError("1Epin image extension is not permitted.");
  }
  return assertSafePublicHttpsUrl(raw, ONEEPIN_IMAGE_HOSTS);
}

export function oneEpinImageUrl(filename: string): string {
  const safe = path.basename(filename);
  if (safe !== filename || !/^[a-f0-9-]+\.(webp|png|jpe?g|avif)$/i.test(safe)) {
    throw new UnsafeRemoteUrlError("Invalid 1Epin image filename.");
  }
  return `https://www.1epin.com/images/oyun/${safe}`;
}

export async function fetchOneEpinImage(filename: string): Promise<{ buffer: Buffer; mimeType: string; finalUrl: string; ext: string }> {
  const candidates = [
    `https://www.1epin.com/images/oyun/${path.basename(filename)}`,
    `https://www.1epin.com/images/kategoriler/${path.basename(filename)}`,
  ];
  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const remote = await fetchAllowlistedBinary(candidate, ONEEPIN_IMAGE_HOSTS);
      const sniffed = sniffImageType(remote.buffer, remote.mimeType);
      await assertSafeOneEpinImageUrl(remote.finalUrl);
      return { buffer: remote.buffer, mimeType: sniffed.mimeType, finalUrl: remote.finalUrl, ext: sniffed.ext };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new UnsafeRemoteUrlError("1Epin image could not be downloaded.");
}

export function sniffImageType(buffer: Buffer, contentType: string | null): { mimeType: string; ext: string } {
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString("utf8").trimStart();
  const type = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml") && head.includes("<svg")) {
    return { mimeType: "image/svg+xml", ext: "svg" };
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mimeType: "image/png", ext: "png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg", ext: "jpg" };
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return { mimeType: "image/webp", ext: "webp" };
  }
  if (type === "image/svg+xml" || type === "image/png" || type === "image/jpeg" || type === "image/webp") {
    throw new UnsafeRemoteUrlError("Remote file content does not match the declared image type.");
  }
  throw new UnsafeRemoteUrlError("Remote file is not a permitted image type.");
}

export function sanitizeSvg(svg: string): string {
  let out = svg.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "");
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  out = out.replace(/javascript:/gi, "");
  out = out.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  if (!out.includes("<svg")) {
    throw new UnsafeRemoteUrlError("Remote SVG is empty or invalid.");
  }
  return out;
}

export async function fetchAllowlistedBinary(
  raw: string,
  allowedHosts: Set<string> = CATALOG_FETCH_HOSTS,
): Promise<{ buffer: Buffer; mimeType: string; finalUrl: string }> {
  let current = await assertSafePublicHttpsUrl(raw, allowedHosts);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": CATALOG_FETCH_USER_AGENT, Accept: "image/svg+xml,image/*,*/*;q=0.1" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new UnsafeRemoteUrlError("Redirect missing Location header.");
      current = await assertSafePublicHttpsUrl(new URL(location, current).toString(), allowedHosts);
      continue;
    }
    if (!response.ok) {
      throw new UnsafeRemoteUrlError(`Remote media request failed (${response.status}).`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.byteLength < 32) throw new UnsafeRemoteUrlError("Remote media file is empty.");
    if (bytes.byteLength > MAX_REMOTE_BYTES) throw new UnsafeRemoteUrlError("Remote media exceeds size limit.");
    const sniffed = sniffImageType(bytes, response.headers.get("content-type"));
    return { buffer: bytes, mimeType: sniffed.mimeType, finalUrl: current.toString() };
  }
  throw new UnsafeRemoteUrlError("Too many redirects.");
}
