import { auth } from "@/auth";
import { can, type PermissionKey } from "@/server/auth/permissions";
import { forbidden, unauthorized } from "next/navigation";
import type { AdminRole } from "@prisma/client";

export async function requireAdmin(permission?: PermissionKey) {
  const session = await auth();
  if (!session?.user?.id || session.user.kind !== "ADMIN" || !session.user.role) {
    unauthorized();
  }
  if (permission && !can(session.user.role as AdminRole, permission)) {
    forbidden();
  }
  return session.user as {
    id: string;
    email: string;
    name?: string | null;
    kind: "ADMIN";
    role: AdminRole;
  };
}
