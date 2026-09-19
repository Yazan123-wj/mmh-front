"use server";

import { z } from "zod";
import { register as registerApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(120).optional(),
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).optional(),
});

export async function registerCustomer(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid" as const };
  }
  const fullName = parsed.data.fullName || parsed.data.name || "";
  if (!fullName) {
    return { ok: false as const, error: "invalid" as const };
  }
  if (parsed.data.password.length < 12) {
    return { ok: false as const, error: "password" as const };
  }
  try {
    await registerApi({
      email: parsed.data.email,
      password: parsed.data.password,
      full_name: fullName,
      phone: parsed.data.phone ?? "",
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof ApiError && error.kind === "validation") {
      return { ok: false as const, error: "invalid" as const };
    }
    return { ok: false as const, error: "unavailable" as const };
  }
}
