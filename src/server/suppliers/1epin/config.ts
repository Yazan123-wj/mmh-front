export const LIVE_DISABLED_MESSAGE =
  "1Epin live mode is disabled. Complete payment integration, static-IP setup and production approval first.";

export const ALLOWED_HOST = "www.1epin.com";
export const TEST_PATH_PREFIX = "/api/test/";
export const DEFAULT_TEST_BASE_URL = "https://www.1epin.com/api/test/";

export class OneEpinConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OneEpinConfigError";
  }
}

export interface OneEpinConfig {
  mode: "test";
  baseUrl: string;
  email: string;
  password: string;
  callbackToken: string;
  timeoutMs: number;
  localOrdersEnabled: boolean;
  currency: string;
}

export function credentialsConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.ONEEPIN_EMAIL?.trim() && env.ONEEPIN_PASSWORD);
}

export function callbackConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.ONEEPIN_CALLBACK_TOKEN && env.ONEEPIN_CALLBACK_TOKEN.length >= 16);
}

export function assertLiveLocked(env: Record<string, string | undefined> = process.env) {
  const mode = (env.ONEEPIN_MODE ?? "test").toLowerCase();
  const allowLive = env.ONEEPIN_ALLOW_LIVE === "true";
  const supplierMode = (env.SUPPLIER_MODE ?? "mock").toLowerCase();
  if (mode === "live" || allowLive || supplierMode === "live") {
    throw new OneEpinConfigError(LIVE_DISABLED_MESSAGE);
  }
}

export function assertAllowedBaseUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OneEpinConfigError("Invalid 1Epin base URL.");
  }
  if (url.protocol !== "https:") {
    throw new OneEpinConfigError("1Epin URLs must use HTTPS.");
  }
  if (url.hostname !== ALLOWED_HOST) {
    throw new OneEpinConfigError("1Epin host is not allowlisted.");
  }
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  if (path.includes("/api/live/")) {
    throw new OneEpinConfigError(LIVE_DISABLED_MESSAGE);
  }
  if (!path.startsWith(TEST_PATH_PREFIX)) {
    throw new OneEpinConfigError("Only the documented 1Epin test path is allowed.");
  }
}

export function resolveOneEpinConfig(env: Record<string, string | undefined> = process.env): OneEpinConfig {
  assertLiveLocked(env);
  const baseUrl = env.ONEEPIN_TEST_BASE_URL || DEFAULT_TEST_BASE_URL;
  assertAllowedBaseUrl(baseUrl);
  const email = env.ONEEPIN_EMAIL?.trim() ?? "";
  const password = env.ONEEPIN_PASSWORD ?? "";
  if (!email || !password) {
    throw new OneEpinConfigError("1Epin test credentials are not configured.");
  }
  const timeoutMs = Number(env.ONEEPIN_REQUEST_TIMEOUT_MS ?? 15000);
  return {
    mode: "test",
    baseUrl: baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
    email,
    password,
    callbackToken: env.ONEEPIN_CALLBACK_TOKEN ?? "",
    timeoutMs: Number.isFinite(timeoutMs) ? Math.min(Math.max(timeoutMs, 1000), 30000) : 15000,
    localOrdersEnabled: env.ONEEPIN_LOCAL_ORDERS_ENABLED === "true",
    currency: env.ONEEPIN_CURRENCY || "TRY",
  };
}

export function publicIntegrationStatus(env: Record<string, string | undefined> = process.env) {
  let liveLocked = true;
  let liveMessage: string | null = null;
  try {
    assertLiveLocked(env);
  } catch (error) {
    liveLocked = true;
    liveMessage = error instanceof Error ? error.message : LIVE_DISABLED_MESSAGE;
  }
  let baseUrlOk = false;
  try {
    assertAllowedBaseUrl(env.ONEEPIN_TEST_BASE_URL || DEFAULT_TEST_BASE_URL);
    baseUrlOk = true;
  } catch {
    baseUrlOk = false;
  }
  return {
    mode: "test" as const,
    liveMode: "locked" as const,
    liveLocked,
    liveMessage,
    credentials: credentialsConfigured(env) ? ("configured" as const) : ("not_configured" as const),
    callback: callbackConfigured(env) ? ("configured" as const) : ("not_configured" as const),
    baseUrlOk,
    timeoutMs: Number(env.ONEEPIN_REQUEST_TIMEOUT_MS ?? 15000),
  };
}
