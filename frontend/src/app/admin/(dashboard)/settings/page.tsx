import { SettingsClient } from "@/components/admin/modules/settings-client";
import { requireAdmin } from "@/server/auth/require-admin";

export default async function Page() {
  await requireAdmin("settings.manage");
  return <SettingsClient  />;
}
