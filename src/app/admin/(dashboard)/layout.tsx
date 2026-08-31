import { requireAdmin } from "@/server/auth/require-admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSession } from "@/components/admin/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <AdminSession>
      <AdminShell name={user.name || user.email} role={user.role}>
        {children}
      </AdminShell>
    </AdminSession>
  );
}
