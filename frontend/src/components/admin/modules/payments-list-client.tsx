"use client";

import { AdminListPage, ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { Badge } from "@/components/admin/ui/badge";
import { formatAdminDateTime } from "@/lib/admin/format";
import { listPayments, type Payment } from "@/lib/api/admin";
import { formatFils } from "@/server/money";

export function PaymentsListClient() {
  return (
    <AdminListPage<Payment>
      title="Payments"
      description="Payment attempts and settlements."
      rowKey={(r) => String(r.id)}
      searchPlaceholder="Search payments…"
      loader={async (token, page, search) => {
        const data = await listPayments(token, { page, page_size: ADMIN_LIST_PAGE_SIZE, search: search || undefined });
        return { items: data.results, count: data.count };
      }}
      columns={[
        { key: "order", header: "Order", render: (r) => r.order_number || "—" },
        { key: "provider", header: "Provider", render: (r) => r.provider },
        { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
        {
          key: "amount",
          header: "Amount",
          className: "tabular-nums",
          render: (r) => `${formatFils(r.amount_fils)} JOD`,
        },
        { key: "created", header: "Created", render: (r) => formatAdminDateTime(r.created_at) },
      ]}
    />
  );
}
