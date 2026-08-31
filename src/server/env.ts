import { z } from "zod";
import { LIVE_DISABLED_MESSAGE } from "@/server/suppliers/1epin/config";

const emptyToUndef = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(16),
    AUTH_URL: z.string().url().optional(),
    CODE_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, "CODE_ENCRYPTION_KEY must be 32 bytes hex"),
    BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
    BOOTSTRAP_ADMIN_PASSWORD: z.string().optional(),
    STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
    STORAGE_LOCAL_DIR: z.string().default("storage/uploads"),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    SUPPLIER_MODE: z.enum(["mock", "test", "live"]).default("mock"),
    ONEEPIN_MODE: z.preprocess(emptyToUndef, z.string().optional()),
    ONEEPIN_ALLOW_LIVE: z.preprocess(emptyToUndef, z.string().optional()),
    ONEEPIN_TEST_BASE_URL: z.preprocess(emptyToUndef, z.string().url().optional()),
    ONEEPIN_REQUEST_TIMEOUT_MS: z.preprocess(emptyToUndef, z.string().optional()),
    ONEEPIN_SYNC_ENABLED: z.preprocess(emptyToUndef, z.enum(["true", "false"]).optional()),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.SUPPLIER_MODE === "live" || (data.ONEEPIN_MODE ?? "test").toLowerCase() === "live") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: LIVE_DISABLED_MESSAGE, path: ["ONEEPIN_MODE"] });
    }
    if (data.ONEEPIN_ALLOW_LIVE === "true") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: LIVE_DISABLED_MESSAGE, path: ["ONEEPIN_ALLOW_LIVE"] });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment: ${keys}`);
  }
  return parsed.data;
}
