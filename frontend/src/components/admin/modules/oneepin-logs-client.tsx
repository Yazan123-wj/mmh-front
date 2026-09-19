"use client";

import { AdminListPage, ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { Badge } from "@/components/admin/ui/badge";
import { formatAdminDateTime } from "@/lib/admin/format";
import { asList, listOneEpinLogs, type SupplierLog } from "@/lib/api/admin";

export function OneEpinLogsClient() {
  return (
    <AdminListPage<SupplierLog>
      title="1Epin logs"
      description="Supplier request and sync logs."
      rowKey={(r) => String(r.id)}
      searchPlaceholder="Search logs…"
      loader={async (token, page, search) => {
        const data = await listOneEpinLogs(token, { page, page_size: ADMIN_LIST_PAGE_SIZE, search: search || undefined });
        return asList(data);
      }}
      columns={[
        { key: "action", header: "Action", render: (r) => r.action },
        {
          key: "status",
          header: "Status",
          render: (r) => (
            <Badge status={r.ok === false ? "FAILED" : r.ok ? "COMPLETED" : r.status || "UNKNOWN"} />
          ),
        },
        { key: "message", header: "Message", render: (r) => r.message || "—" },
        { key: "created", header: "When", render: (r) => formatAdminDateTime(r.created_at) },
      ]}
    />
  );
}
