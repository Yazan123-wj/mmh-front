const SECRET_KEYS = new Set([
  "emailaddress",
  "password",
  "pincodes",
  "pin",
  "code",
  "token",
  "secret",
  "ciphertext",
  "authtag",
  "sessiontoken",
  "callbacktoken",
]);

export function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEYS.has(key.toLowerCase())) return "[redacted]";
  return value;
}

export function redactDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) return "[redacted-list]";
    return value.map(redactDeep);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactValue(key, redactDeep(item))]),
    );
  }
  return value;
}

export function redactText(input: string) {
  return input
    .replace(/"password"\s*:\s*"[^"]*"/gi, '"password":"[redacted]"')
    .replace(/"emailAddress"\s*:\s*"[^"]*"/gi, '"emailAddress":"[redacted]"')
    .replace(/"PinCodes"\s*:\s*\[[^\]]*\]/gi, '"PinCodes":"[redacted]"')
    .replace(/"pinCodes"\s*:\s*\[[^\]]*\]/gi, '"pinCodes":"[redacted]"');
}
