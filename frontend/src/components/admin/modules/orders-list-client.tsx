"use client";

import { AdminListPage, ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { Badge } from "@/components/admin/ui/badge";
import { formatAdminDateTime } from "@/lib/admin/format";
import { listOrders, type AdminOrder } from "@/lib/api/admin";
import { formatFils } from "@/server/money";
import Link from "next/link";

export function OrdersListClient() {
  return (
    <AdminListPage<AdminOrder>
      title="Orders"
      description="Customer orders from Django `/admin/orders/`."
      rowKey={(r) => String(r.id)}
      searchPlaceholder="Search orders…"
      loader={async (token, page, search) => {
        const data = await listOrders(token, { page, page_size: ADMIN_LIST_PAGE_SIZE, search: search || undefined });
        return { items: data.results, count: data.count };
      }}
      columns={[
        {
          key: "number",
          header: "Order",
          render: (r) => (
            <Link href={`/admin/orders/${r.id}`} className="font-medium text-[var(--clicks-blue)]">
              {r.order_number}
            </Link>
          ),
        },
        {
          key: "customer",
          header: "Customer",
          render: (r) => (
            <div>
              <p>{r.full_name || "—"}</p>
              <p className="text-xs text-[var(--clicks-muted)]">{r.email}</p>
            </div>
          ),
        },
        {
          key: "payment",
          header: "Payment",
          render: (r) => <Badge status={r.payment_status} />,
        },
        {
          key: "fulfillment",
          header: "Fulfillment",
          render: (r) => <Badge status={r.fulfillment_status} />,
        },
        {
          key: "total",
          header: "Total",
          className: "tabular-nums",
          render: (r) => `${formatFils(r.total_fils)} JOD`,
        },
        { key: "created", header: "Created", render: (r) => formatAdminDateTime(r.created_at) },
      ]}
    />
  );
}
