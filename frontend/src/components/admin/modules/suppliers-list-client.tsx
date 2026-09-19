"use client";

import { AdminListPage, ADMIN_LIST_PAGE_SIZE } from "@/components/admin/admin-list-page";
import { Badge } from "@/components/admin/ui/badge";
import { formatAdminDateTime } from "@/lib/admin/format";
import { asList, listSuppliers, type Supplier } from "@/lib/api/admin";
import Link from "next/link";

export function SuppliersListClient() {
  return (
    <AdminListPage<Supplier>
      title="Suppliers"
      description="Fulfillment suppliers."
      rowKey={(r) => String(r.id)}
      searchPlaceholder="Search suppliers…"
      loader={async (token, page, search) => {
        const data = await listSuppliers(token, { page, page_size: ADMIN_LIST_PAGE_SIZE, search: search || undefined });
        return asList(data);
      }}
      columns={[
        {
          key: "name",
          header: "Supplier",
          render: (r) => (
            <Link href={`/admin/suppliers/${r.id}`} className="font-medium text-[var(--clicks-blue)]">
              {r.name}
            </Link>
          ),
        },
        { key: "slug", header: "Slug", render: (r) => r.slug },
        {
          key: "status",
          header: "Status",
          render: (r) => <Badge status={r.active ? "ACTIVE" : "DISABLED"} />,
        },
        {
          key: "env",
          header: "Environment",
          render: (r) => r.environment || "—",
        },
        {
          key: "checked",
          header: "Last checked",
          render: (r) => formatAdminDateTime(r.last_checked_at),
        },
      ]}
    />
  );
}
