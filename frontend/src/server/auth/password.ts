/** Password helpers moved to Django. Kept as no-ops for legacy imports. */
export async function hashPassword(password: string) {
  return `django:${password.length}`;
}

export async function verifyPassword(..._args: [string, string]) {
  void _args;
  return false;
}

export function validatePasswordStrength(password: string) {
  const ok = password.length >= 8;
  return { ok, message: ok ? "" : "Password too short" };
}
