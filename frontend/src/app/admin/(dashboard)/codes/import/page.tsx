import { CodeImportClient } from "@/components/admin/modules/code-import-client";
import { requireAdmin } from "@/server/auth/require-admin";
import { Suspense } from "react";

export default async function Page() {
  await requireAdmin("codes.manage");
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-xl border border-[var(--clicks-border)] bg-white" />}>
      <CodeImportClient />
    </Suspense>
  );
}
