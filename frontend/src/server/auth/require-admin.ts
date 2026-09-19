import { auth } from "@/auth";
import {
  hasPermission,
  permissionsFor,
  type AdminRole,
  type PermissionKey,
} from "@/server/auth/permissions";
import { redirect } from "next/navigation";

export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  kind: "ADMIN";
  role: AdminRole;
  permissions: PermissionKey[];
  accessToken?: string;
};

export async function requireAdmin(permission?: PermissionKey): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user?.id || session.user.kind !== "ADMIN" || !session.user.role) {
    redirect("/admin/login");
  }

  const role = session.user.role as AdminRole;
  const fromSession = session.user.permissions as string[] | undefined;
  const permissions = (fromSession?.length ? fromSession : permissionsFor(role)) as PermissionKey[];

  if (permission && !hasPermission(permissions, permission, role)) {
    redirect("/admin/unauthorized");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    kind: "ADMIN",
    role,
    permissions,
    accessToken: session.user.accessToken,
  };
}
