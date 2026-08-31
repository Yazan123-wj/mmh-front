export function pickLocalized<T extends { locale: string }>(rows: T[], locale: string): T | undefined {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === "en") ?? rows[0];
}

export function localizedText(
  rows: Array<{ locale: string; value: string }>,
  locale: string,
  fallback = "",
): string {
  const match = pickLocalized(rows, locale);
  return match?.value || fallback;
}
