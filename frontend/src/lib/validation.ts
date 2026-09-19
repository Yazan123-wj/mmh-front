export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidJordanPhone(value: string): boolean {
  const compact = value.replace(/[\s-]/g, "");
  return /^\+?9627\d{8}$/.test(compact) || /^07\d{8}$/.test(compact);
}

export function isValidDemoPhone(value: string): boolean {
  if (value.includes("7X")) return true;
  return isValidJordanPhone(value);
}

export function isValidPlayerId(value: string): boolean {
  return /^[A-Za-z0-9_-]{5,24}$/.test(value.trim());
}

export function isValidZoneId(value: string): boolean {
  return /^\d{1,8}$/.test(value.trim());
}

export function validateCustomerField(id: string, value: string, required: boolean): boolean {
  const trimmed = value.trim();
  if (!trimmed) return !required;
  if (id === "playerId" || id === "userId" || id === "characterId") return isValidPlayerId(trimmed);
  if (id === "zoneId" || id === "serverId") return isValidZoneId(trimmed);
  if (id === "email") return isValidEmail(trimmed);
  if (id === "tel") return isValidDemoPhone(trimmed);
  return trimmed.length >= 2;
}
