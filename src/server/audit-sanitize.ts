export function sanitizeAudit(value: unknown) {
  if (value == null) return undefined;
  const json = JSON.stringify(value);
  const redacted = json.replace(
    /"(password|passwordHash|token|secret|ciphertext|authTag|pin|code|sessionToken|PinCodes|emailAddress)"\s*:\s*("[^"]*"|\[[^\]]*\])/gi,
    '"$1":"[redacted]"',
  );
  try {
    return JSON.parse(redacted) as object;
  } catch {
    return { note: "unserializable" };
  }
}
