"use client";

import { AdminListPage, ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { formatAdminDateTime } from "@/lib/admin/format";
import { listAuditLogs, type AuditLog } from "@/lib/api/admin";

export function AuditListClient() {
  return (
    <AdminListPage<AuditLog>
      title="Audit log"
      description="Sensitive admin actions."
      rowKey={(r) => String(r.id)}
      searchPlaceholder="Search audit…"
      loader={async (token, page, search) => {
        const data = await listAuditLogs(token, { page, page_size: ADMIN_LIST_PAGE_SIZE, search: search || undefined });
        return { items: data.results, count: data.count };
      }}
      columns={[
        { key: "action", header: "Action", render: (r) => r.action },
        { key: "actor", header: "Actor", render: (r) => r.actor_email || "—" },
        {
          key: "entity",
          header: "Entity",
          render: (r) => (r.entity_type ? `${r.entity_type} ${r.entity_id ?? ""}`.trim() : "—"),
        },
        { key: "when", header: "When", render: (r) => formatAdminDateTime(r.created_at) },
      ]}
    />
  );
}
