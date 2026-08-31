import { prisma } from "@/server/db";
import { requireAdmin } from "@/server/auth/require-admin";
import { PERMISSIONS } from "@/server/auth/permissions";

export default async function SettingsPage() {
  await requireAdmin(PERMISSIONS.settingsWrite);
  const settings = await prisma.systemSetting.findMany();
  const flags = await prisma.featureFlag.findMany();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <ul className="space-y-2 text-sm">
        {settings.map((item) => (
          <li key={item.id} className="rounded-xl border border-[#E7EAF1] bg-white p-4">{item.key}: {JSON.stringify(item.value)}</li>
        ))}
        {flags.map((item) => (
          <li key={item.id} className="rounded-xl border border-[#E7EAF1] bg-white p-4">{item.key}: {item.enabled ? "on" : "off"}</li>
        ))}
      </ul>
    </div>
  );
}
