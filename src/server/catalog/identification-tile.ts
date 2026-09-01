import { sanitizeSvg } from "@/server/media/safe-fetch";
import type { CatalogArtworkSource } from "@/server/catalog/artwork-sources";

const TILE = 720;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(background: string, inner: string, title: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${TILE} ${TILE}" width="${TILE}" height="${TILE}" role="img" aria-label="${escapeXml(title)}">
  <title>${escapeXml(title)}</title>
  <rect width="${TILE}" height="${TILE}" fill="${background}"/>
  ${inner}
</svg>
`;
}

export function nameOnlyTile(source: CatalogArtworkSource): string {
  const fill = source.background === "#F7F9FF" ? "#17182B" : "#F7F9FF";
  const muted = source.background === "#F7F9FF" ? "#565895" : "#B8BAD2";
  const lines = source.title.split(" ").reduce<string[]>((acc, word) => {
    const last = acc[acc.length - 1];
    if (!last || `${last} ${word}`.length > 16) acc.push(word);
    else acc[acc.length - 1] = `${last} ${word}`;
    return acc;
  }, []);
  const startY = 340 - ((lines.length - 1) * 44) / 2;
  const text = lines
    .map(
      (line, index) =>
        `<text x="360" y="${startY + index * 52}" text-anchor="middle" fill="${fill}" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="44" font-weight="700">${escapeXml(line)}</text>`,
    )
    .join("\n  ");
  return wrap(
    source.background,
    `<text x="360" y="210" text-anchor="middle" fill="${muted}" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" font-weight="600" letter-spacing="6">MMH</text>
  ${text}`,
    source.title,
  );
}

export function logoTile(source: CatalogArtworkSource, logoSvg: string): string {
  const clean = sanitizeSvg(logoSvg);
  const href = `data:image/svg+xml;base64,${Buffer.from(clean).toString("base64")}`;
  const invert = source.invertLogo ? ` style="filter:invert(1)"` : "";
  return wrap(
    source.background,
    `<image href="${href}" xlink:href="${href}" x="90" y="150" width="540" height="420" preserveAspectRatio="xMidYMid meet"${invert}/>`,
    source.title,
  );
}

export function buildIdentificationTile(source: CatalogArtworkSource, logoSvg?: string): { svg: string; usedLogo: boolean } {
  if (source.kind === "generic-identification" && logoSvg) {
    return { svg: logoTile(source, logoSvg), usedLogo: true };
  }
  return { svg: nameOnlyTile(source), usedLogo: false };
}
