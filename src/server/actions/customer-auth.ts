"use server";

import { prisma } from "@/server/db";
import { hashPassword, validatePasswordStrength } from "@/server/auth/password";
import { rateLimit } from "@/server/rate-limit";
import { writeAudit } from "@/server/audit";
import { z } from "zod";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(6).max(32),
  password: z.string().max(128),
});

export async function registerCustomer(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (validatePasswordStrength(parsed.data.password)) return { ok: false, error: "password" };
  if (!rateLimit(`customer-register:${parsed.data.email}`, 5, 30 * 60 * 1000)) return { ok: false, error: "unavailable" };

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        kind: "CUSTOMER",
        customer: { create: { phone: parsed.data.phone } },
      },
    });
    await writeAudit({ actorId: user.id, action: "customer.register", entityType: "User", entityId: user.id });
    return { ok: true };
  } catch {
    // Deliberately generic: do not disclose whether an email already exists.
    return { ok: false, error: "unavailable" };
  }
}
