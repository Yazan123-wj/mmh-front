import { prisma } from "@/server/db";
import { sanitizeAudit } from "@/server/audit-sanitize";

export { sanitizeAudit };

export async function writeAudit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? undefined,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: sanitizeAudit(input.before),
      afterJson: sanitizeAudit(input.after),
      ip: input.ip ?? undefined,
      userAgent: input.userAgent ?? undefined,
    },
  });
}

