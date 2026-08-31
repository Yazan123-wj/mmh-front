import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { createAdminAccount } from "@/server/actions/admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function AdministratorsPage() {
  await requireAdmin(PERMISSIONS.adminWrite);
  const admins = await prisma.adminProfile.findMany({ include: { user: true } });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Administrators</h1>
      <ul className="space-y-2">
        {admins.map((admin) => (
          <li key={admin.id} className="rounded-xl border border-[#E7EAF1] bg-white p-4 text-sm">
            {admin.user.email} · {admin.role}
          </li>
        ))}
      </ul>
      <form action={createAdminAccount} className="mt-4 grid max-w-xl gap-2 rounded-xl border border-[#E7EAF1] bg-white p-4">
        <h2 className="text-sm font-semibold">Create admin</h2>
        <input name="email" type="email" required placeholder="Email" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="name" placeholder="Name" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <input name="password" type="password" required placeholder="Temporary password" className="h-9 rounded-lg border border-[#E7EAF1] px-3 text-sm" />
        <select name="role" className="h-9 rounded-lg border border-[#E7EAF1] px-2 text-sm">
          {["ADMIN", "CATALOG_MANAGER", "ORDER_MANAGER", "CONTENT_MANAGER", "SUPPORT_AGENT", "VIEWER"].map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>
        <button className="h-9 rounded-lg bg-[#0040FD] text-sm font-semibold text-white">Create</button>
      </form>
      <p className="mt-3 text-xs text-[#616674]">Public registration is disabled. New admins are created by authorized admins only.</p>
    </div>
  );
}
